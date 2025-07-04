import { Injectable, Logger } from "@nestjs/common";
import { ProductsGrpcClientService } from "src/grpc/client/product.service";
import { UserGrpcClientService } from "src/grpc/client/user.service";
import { ItemDto } from "./dto/list-product.dto";
import { Product } from "src/product/product/entities/product.entity";

import { CheckAvailabilityResult, OrderDetail } from "./dto/validate-response.dto";
import { FarmStatus } from "src/common/enums/product/farm-status.enum";
import { ProductStatus } from "src/common/enums/product/product-status.enum";
import {
    Product as GrpcProduct,
    Farm as GrpcFarm,
} from "@farmera/grpc-proto/dist/products/products";
import { Farm } from "src/product/farm/entities/farm.entity";
import { User } from "src/user/entities/user.entity";
import { UserStatus } from "src/common/enums/user/status.enum";
import { Location } from "src/user/entities/location.entity";
import { OrderInfoRequestDto, OrderRequestDto, SuborderRequestDto } from "src/orders/dto/order.dto";
import { OrderInfoRequest } from "@farmera/grpc-proto/dist/payment/payment";
import { Issue, ShippingFeeDetails } from "src/delivery/enitites/cart.entity";
import { GhnService } from "src/ghn/ghn.service";
import { Payment } from "src/payments/entities/payment.entity";
import { use } from "passport";

@Injectable()
export class BusinessValidationService {
    private readonly logger = new Logger(BusinessValidationService.name);
    constructor(
        private readonly userGrpcClientService: UserGrpcClientService,
        private readonly productsGrpcClientService: ProductsGrpcClientService,
        private readonly ghnService: GhnService,

    ) { }

    async validateSubOrder(value: SuborderRequestDto): Promise<ShippingFeeDetails | Issue[]> {
        this.logger.log(`Validating suborder with ${JSON.stringify(value, null, 2)} suborders.`);
        const result: Issue[] = [];


        if (!value) {
            result.push({
                reason: 'REQUEST_EMPTY',
                details: 'Request body is empty or not provided.',
            });
            return result;
        }
        if (!value.farm_id || typeof value.farm_id !== 'string' || value.farm_id.trim() === '') {
            this.logger.warn('Farm ID is missing or invalid in suborder request.');
            result.push({ reason: 'FARM_ID_MISSING_OR_INVALID', details: 'Farm ID is missing or invalid in suborder request.' });
            return result;
        }
        if (!Array.isArray(value.products) || value.products.length === 0) {
            this.logger.warn('ItemRequestDto is empty or not an array in suborder request.');
            result.push({
                reason: 'ITEM_REQUEST_EMPTY',
                details: 'ItemRequest is empty or not an array in request.',
                farm_id: value.farm_id,
            });
            return result;
        }

        const productsToFetchDetailsFor: any[] = [];
        for (const requestProduct of value.products) {
            if (typeof requestProduct.product_id !== 'number' || isNaN(requestProduct.product_id)) {
                this.logger.warn(`Invalid product_id in suborder request: ${JSON.stringify(requestProduct)}`);
                result.push({
                    reason: 'PRODUCT_ID_INVALID',
                    details: 'Product ID is missing or not a valid number.',
                    product_id: requestProduct?.product_id || 0,
                });
                continue;
            }
            if (typeof requestProduct.quantity !== 'number' || isNaN(requestProduct.quantity) || requestProduct.quantity <= 0) {
                this.logger.warn(`Invalid quantity in suborder request: ${JSON.stringify(requestProduct)}`);
                result.push({
                    reason: 'QUANTITY_INVALID',
                    product_id: requestProduct.product_id,
                    details: 'Quantity is missing, not a valid number, or not greater than zero.',
                });
                continue;
            }
            productsToFetchDetailsFor.push(requestProduct);
        }
        if (productsToFetchDetailsFor.length === 0) {
            this.logger.warn('No structurally valid items to fetch details for in suborder request.');
            result.push({
                reason: 'ITEM_REQUEST_EMPTY',
                details: 'ItemRequest is empty or not an array in request.',
                farm_id: value.farm_id,
            });
            return result;
        }
        // --- Bước 3: Lấy thông tin chi tiết sản phẩm và Farm từ Product Service ---
        let grpcResponse: Product[];
        let farmResponse: Farm;
        try {
            [grpcResponse, farmResponse] = await Promise.all([
                this.productsGrpcClientService.getListProducts(productsToFetchDetailsFor.map(item => item.product_id)),
                this.productsGrpcClientService.getFarm(value.farm_id)
            ]);
            this.logger.log(`Farm response: ${JSON.stringify(farmResponse, null, 2)}`);
        } catch (error) {
            this.logger.error('Failed to fetch product or farm details from gRPC service:', error);
            result.push({
                reason: 'SERVICE_UNAVAILABLE_FOR_PRODUCT_DETAILS',
                details: `Failed to retrieve product information: ${(error as Error).message}`,
                farm_id: value.farm_id,
            });
            return result;
        }

        // --- Bước 4: Kiểm tra tính hợp lệ của Farm ---
        let isFarmValid = true;
        if (!farmResponse || !farmResponse.farm_id) {
            result.push({
                reason: 'FARM_NOT_FOUND',
                farm_id: value.farm_id,
                details: 'Farm not found or farm_id is missing in response from product service.'
            });
            isFarmValid = false;
        } else {
            if (farmResponse.status !== FarmStatus.APPROVED) {
                this.logger.warn(`Farm ID ${value.farm_id} is not approved. Status: ${farmResponse.status}`);
                result.push({
                    reason: 'FARM_NOT_APPROVED',
                    farm_id: value.farm_id,
                    details: `Farm is not in APPROVED status. Current status: ${farmResponse.status}.`
                });
                isFarmValid = false;
            }
            if (!farmResponse.address) {
                this.logger.warn(`Farm ID ${value.farm_id} has invalid address.`);
                result.push({
                    reason: 'FARM_ADDRESS_INVALID',
                    farm_id: value.farm_id,
                    details: 'Farm address information is missing or incomplete.'
                });
                isFarmValid = false;
            }
            if (!farmResponse.address?.address_ghn || !farmResponse.address.address_ghn.province_id || !farmResponse.address.address_ghn.district_id || !farmResponse.address.address_ghn.ward_code) {
                this.logger.warn(`Farm ID ${value.farm_id} has invalid GHN configuration.`);
                result.push({
                    reason: 'FARM_GHN_CONFIG_MISSING',
                    farm_id: value.farm_id,
                    details: 'Farm is not configured for GHN delivery.'
                });
                isFarmValid = false;
            }
        }

        // Nếu farm không hợp lệ, không cần kiểm tra sản phẩm nữa
        if (!isFarmValid) {
            return result;
        }
        let resultValidation: ShippingFeeDetails = {
            farm_id: value.farm_id,
            farm_name: farmResponse.farm_name,
            phone: farmResponse.phone,
            shipping_fee: 0, // Sẽ cập nhật sau khi tính toán
            avatar_url: farmResponse.avatar_url,
            total: 0, // Sẽ cập nhật sau khi tính toán
            currency: 'VND', // Giả định là VND, có thể thay đổi tùy theo yêu cầu
            city: farmResponse.address?.city || '',
            district: farmResponse.address?.district || '',
            ward: farmResponse.address?.ward || '',
            street: farmResponse.address?.street || '',
            street_number: '',
            city_code: farmResponse.address!.address_ghn!.province_id!,
            district_code: farmResponse.address!.address_ghn!.district_id!,
            ward_code: farmResponse.address!.address_ghn!.ward_code,
            products: [],
        };

        // --- Bước 5: Xử lý kết quả gRPC và kiểm tra từng sản phẩm ---
        const actualProductsMap = new Map<number, Product>();
        if (grpcResponse && Array.isArray(grpcResponse)) {
            for (const productResp of grpcResponse) {
                if (productResp && typeof productResp.product_id === 'number') {
                    actualProductsMap.set(productResp.product_id, productResp);
                }
            }
        }

        for (const requestedItem of productsToFetchDetailsFor) {
            const actualProduct = actualProductsMap.get(requestedItem.product_id);

            if (!actualProduct) {
                result.push({
                    reason: 'PRODUCT_NOT_FOUND',
                    product_id: requestedItem.product_id,
                    details: 'Product details not returned by the product service.'
                });
                continue;
            }

            // Kiểm tra sản phẩm có thuộc đúng farm không
            if (actualProduct.farm?.farm_id !== value.farm_id) {
                result.push({
                    reason: 'PRODUCT_DOES_NOT_BELONG_TO_FARM',
                    product_id: requestedItem.product_id,
                    farm_id: value.farm_id,
                    details: 'This product does not belong to the specified farm.'
                });
                continue;
            }

            const productStatus = actualProduct.status;
            if (productStatus !== ProductStatus.PRE_ORDER && productStatus !== ProductStatus.OPEN_FOR_SALE) {
                result.push({
                    reason: 'PRODUCT_INACTIVE_OR_UNAVAILABLE',
                    product_id: requestedItem.product_id,
                    details: `Product status is ${productStatus}, not available for order.`
                });
                continue;
            }

            if (actualProduct.stock_quantity < requestedItem.quantity) {
                result.push({
                    reason: 'INSUFFICIENT_STOCK',
                    product_id: requestedItem.product_id,
                    details: 'Insufficient stock for the requested quantity.'
                });
                continue;
            }

            resultValidation.products.push({
                product_id: actualProduct.product_id,
                product_name: actualProduct.product_name,
                quantity: actualProduct.stock_quantity,
                requested_quantity: requestedItem.quantity,
                unit: actualProduct.unit,
                price_per_unit: actualProduct.price_per_unit,
                total_price: requestedItem.quantity * actualProduct.price_per_unit,
                weight: actualProduct.weight,
                image_url: actualProduct.image_urls && actualProduct.image_urls.length > 0 ? actualProduct.image_urls[0] : undefined
            });
        }

        // --- Bước 6: Xác định kết quả cuối cùng ---
        if (result.length === 0 && resultValidation.products.length > 0) {
            let totalFee = 0;
            for (const product of resultValidation.products) {
                totalFee += product.total_price;
            }
            resultValidation.total = totalFee;
            return resultValidation;
        }
        return result;
    }

    async validateOrderInfoToCalculateShippingFee(value: OrderInfoRequestDto): Promise<{ user: User, address: Location, province_code: number, district_code: number, ward_code: string } | Issue[]> {
        const result: Issue[] = [];
        if (!value || !value.user_id) {
            result.push({
                reason: 'USER_ID_MISSING',
                details: 'User ID is required for the order.',
            });
            return result;
        }
        try {
            // 1.1 Gọi User Service để kiểm tra người dùng có tồn tại và active không
            const user: User = await this.userGrpcClientService.getUser(value.user_id);
            if (!user || user.status !== UserStatus.ACTIVE) {
                result.push({
                    reason: 'USER_NOT_FOUND_OR_INACTIVE',
                    user_id: value.user_id,
                    details: 'User account is not active or does not exist.'
                });
                return result;
            }

            this.logger.log(`User found: ${JSON.stringify(user.locations, null, 2)}`);
            // 1.2 Kiểm tra địa chỉ giao hàng có hợp lệ không
            const userLocation: Location = await this.userGrpcClientService.getLocationById(value.address_id);
            this.logger.log(`User Location: ${JSON.stringify(userLocation, null, 2)}`);
            if (!userLocation ||
                !userLocation.location_id ||
                !user.locations ||
                !user.locations.some(loc => loc.location_id === userLocation.location_id)
            ) {
                result.push({
                    reason: 'INVALID_ADDRESS_ID',
                    user_id: value.user_id,
                    details: 'Address ID is invalid, does not exist, or does not belong to the specified user.'
                });
                return result;
            }
            if (!userLocation.city || !userLocation.district || !userLocation.ward) {
                result.push({
                    reason: 'ADDRESS_INFO_MISSING',
                    user_id: value.user_id,
                    details: 'Address information (city, district, ward) is missing.'
                });
                return result;
            }
            // 1.3 Kiểm tra province_code, district_code, ward_code
            const provinceCode = await this.ghnService.getIdProvince(userLocation.city);
            this.logger.log(`Province code: ${JSON.stringify(provinceCode, null, 2)}`);
            if (provinceCode == null) {
                result.push({
                    reason: 'PROVINCE_CODE_MISSING',
                    user_id: value.user_id,
                    details: 'Province code is missing or invalid.'
                });
                return result;
            }
            const districtCode = await this.ghnService.getIdDistrict(userLocation.district, provinceCode);
            if (districtCode == null) {
                result.push({
                    reason: 'DISTRICT_CODE_MISSING',
                    user_id: value.user_id,
                    details: 'District code is missing or invalid.'
                });
                return result;
            }
            const wardCode: string | null = await this.ghnService.getIdWard(userLocation.ward, districtCode);
            if (wardCode == null || wardCode === '') {
                result.push({
                    reason: 'WARD_CODE_MISSING',
                    user_id: value.user_id,
                    details: 'Ward code is missing or invalid.'
                });
                return result;
            }
            return {
                user,
                address: userLocation,
                province_code: provinceCode,
                district_code: districtCode,
                ward_code: wardCode
            };
        } catch (error) {
            this.logger.error('Error during order info validation:', error);
            result.push({ reason: 'ORDER_INFO_VALIDATION_SERVICE_UNAVAILABLE', details: `Could not validate order information due to service error: ${(error as Error).message}` });
            return result;
        }
    }

    async validateOrderInfo(value: OrderInfoRequestDto): Promise<{ user: User, address: Location } | Issue[]> {
        const result: Issue[] = [];
        if (!value || !value.user_id) {
            result.push({
                reason: 'USER_ID_MISSING',
                details: 'User ID is required for the order.',
            });
            return result;
        }
        try {
            // 1.1 Gọi User Service để kiểm tra người dùng có tồn tại và active không
            const user: User = await this.userGrpcClientService.getUser(value.user_id);
            if (!user || user.status !== UserStatus.ACTIVE) {
                result.push({
                    reason: 'USER_NOT_FOUND_OR_INACTIVE',
                    user_id: value.user_id,
                    details: 'User account is not active or does not exist.'
                });
                return result;
            }

            this.logger.log(`User found: ${JSON.stringify(user.locations, null, 2)}`);
            // 1.2 Kiểm tra địa chỉ giao hàng có hợp lệ không
            const userLocation: Location = await this.userGrpcClientService.getLocationById(value.address_id);
            this.logger.log(`User Location: ${JSON.stringify(userLocation, null, 2)}`);
            if (!userLocation ||
                !userLocation.location_id ||
                !user.locations ||
                !user.locations.some(loc => loc.location_id === userLocation.location_id)
            ) {
                result.push({
                    reason: 'INVALID_ADDRESS_ID',
                    user_id: value.user_id,
                    details: 'Address ID is invalid, does not exist, or does not belong to the specified user.'
                });
                return result;
            }
            if (!userLocation.city || !userLocation.district || !userLocation.ward) {
                result.push({
                    reason: 'ADDRESS_INFO_MISSING',
                    user_id: value.user_id,
                    details: 'Address information (city, district, ward) is missing.'
                });
                return result;
            }
            if (!userLocation.phone || userLocation.phone.trim() === '') {
                if (!user.phone || user.phone.trim() === '') {
                    result.push({
                        reason: 'PHONE_NUMBER_MISSING',
                        user_id: value.user_id,
                        details: 'Phone number is missing or invalid.'
                    });
                    return result;
                }
                userLocation.phone = user.phone; // Sử dụng số điện thoại của người dùng nếu địa chỉ không có
            }
            if (!userLocation.name || userLocation.name.trim() === '') {
                userLocation.name = user.last_name + ' ' + user.first_name; // Sử dụng tên người dùng nếu địa chỉ không có
            }
            return {
                user,
                address: userLocation,
            };
        } catch (error) {
            this.logger.error('Error during order info validation:', error);
            result.push({ reason: 'ORDER_INFO_VALIDATION_SERVICE_UNAVAILABLE', details: `Could not validate order information due to service error: ${(error as Error).message}` });
            return result;
        }
    }

}
