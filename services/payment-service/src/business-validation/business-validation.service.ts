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
import { OrderInfoRequestDto, OrderRequestDto, SuborderRequestDto } from "src/orders/dto/order_dto";
import { OrderInfoRequest } from "@farmera/grpc-proto/dist/payment/payment";
import { Issue, ShippingFeeDetails } from "src/delivery/enitites/cart.entity";
import { GhnService } from "src/ghn/ghn.service";

@Injectable()
export class BusinessValidationService {
    private readonly logger = new Logger(BusinessValidationService.name);
    constructor(
        private readonly userGrpcClientService: UserGrpcClientService,
        private readonly productsGrpcClientService: ProductsGrpcClientService,
        private readonly ghnService: GhnService,

    ) { }

    // async validateOrder(userRequestList: ItemDto[], orderDetails: OrderDetail): Promise<CheckAvailabilityResult> {
    //     const result: CheckAvailabilityResult = {
    //         isValidOrder: false,
    //         validOrderItems: [],
    //         issues: [],
    //     }

    //     // --- Bước 1: Kiểm tra User, Địa chỉ và Phương thức thanh toán (Mô tả & Comment) ---


    //     if (!orderDetails || !orderDetails.user_id) {
    //         result.issues.push({ reason: 'USER_ID_MISSING', details: 'User ID is required for the order.' });
    //     } else {
    //         try {
    //             // 1.1 Gọi User Service để kiểm tra người dùng có tồn tại và active không
    //             const user: User = await this.userGrpcClientService.getUser(orderDetails.user_id);
    //             if (!user || user.status !== UserStatus.ACTIVE) {
    //                 result.issues.push({ reason: 'USER_NOT_FOUND_OR_INACTIVE', user_id: orderDetails.user_id, details: 'User account is not active or does not exist.' });
    //             }

    //             // 1.2 Kiểm tra địa chỉ giao hàng có hợp lệ không
    //             // if (!orderDetails.shipping_address || !this.isValidAddress(orderDetails.shipping_address)) {
    //             //     result.issues.push({ reason: 'INVALID_SHIPPING_ADDRESS', user_id: orderDetails.user_id, details: 'Shipping address is missing or invalid.' });
    //             // }

    //             const userLocation: Location = await this.userGrpcClientService.getLocationById(orderDetails.address_id);
    //             this.logger.log(`User Location: ${JSON.stringify(userLocation, null, 2)}`);
    //             if (!userLocation || !userLocation.location_id || userLocation.user_id !== user.id || userLocation.user_id !== orderDetails.user_id) {
    //                 result.issues.push({
    //                     reason: 'INVALID_ADDRESS_ID',
    //                     user_id: orderDetails.user_id,
    //                     details: 'Address ID is invalid, does not exist, or does not belong to the specified user.'
    //                 });
    //             }



    //             // 1.3 Kiểm tra khả năng thanh toán nếu là thanh toán online
    //             // const onlineMethods = ['ONLINE_BANKING', 'E_WALLET']; // Định nghĩa các phương thức online
    //             // if (onlineMethods.includes(orderDetails.payment_method)) {
    //             //     // const canPayOnline = await this.userService.checkPaymentCapability(orderDetails.user_id);
    //             //     // if (!canPayOnline) {
    //             //     //    result.issues.push({ reason: 'USER_CANNOT_PAY_ONLINE', user_id: orderDetails.user_id, payment_method: orderDetails.payment_method, details: 'User is not allowed or configured for online payments.' });
    //             //     // }
    //             // }

    //         } catch (error) {
    //             this.logger.error('Error during user validation:', error);
    //             // Nếu không thể kết nối User Service
    //             result.issues.push({ reason: 'USER_VALIDATION_SERVICE_UNAVAILABLE', user_id: orderDetails.user_id, details: 'Could not validate user information due to service error.' });
    //         }
    //     }




    //     if (!Array.isArray(userRequestList) || userRequestList.length === 0) {
    //         this.logger.warn('User request list is empty or not an array.');
    //         // Nếu không có sản phẩm, không cần kiểm tra thêm về sản phẩm.
    //         // Chỉ trả về kết quả dựa trên kiểm tra user ở trên.
    //         result.isValidOrder = result.issues.length === 0; // True nếu không có lỗi user và không có sản phẩm
    //         return result;
    //     }

    //     const itemsToFetchDetailsFor: any[] = [];

    //     // --- Bước 2: Kiểm tra cấu trúc cơ bản của từng sản phẩm ---
    //     for (const requestedItem of userRequestList) {
    //         // Kiểm tra product_id
    //         if (!requestedItem || typeof requestedItem.product_id !== 'number' || isNaN(requestedItem.product_id)) {
    //             this.logger.warn(`Invalid product_id in user request: ${JSON.stringify(requestedItem)}`);
    //             result.issues.push({
    //                 reason: 'INVALID_PRODUCT_ID_FORMAT',
    //                 requested_product_id: requestedItem?.product_id || 0,
    //                 details: 'Product ID is missing or not a valid number.'
    //             });
    //             continue;
    //         }
    //         // Kiểm tra quantity
    //         if (typeof requestedItem.quantity !== 'number' || isNaN(requestedItem.quantity) || requestedItem.quantity <= 0) {
    //             this.logger.warn(`Invalid quantity in user request: ${JSON.stringify(requestedItem)}`);
    //             result.issues.push({
    //                 reason: 'INVALID_QUANTITY',
    //                 requested_product_id: requestedItem.product_id,
    //                 requested_quantity: requestedItem.quantity,
    //                 details: 'Quantity is missing, not a valid number, or not greater than zero.'
    //             });
    //             continue;
    //         }
    //         itemsToFetchDetailsFor.push(requestedItem);
    //     }

    //     if (itemsToFetchDetailsFor.length === 0) {
    //         this.logger.warn('No structurally valid items to fetch details for.');
    //         result.isValidOrder = result.issues.length === 0;
    //         return result;
    //     }

    //     // --- Bước 3: Lấy thông tin chi tiết sản phẩm và Farm từ Product Service ---
    //     let grpcResponse: Product[]; // GetListProductsResponse
    //     try {
    //         // Gọi hàm gốc của bạn để lấy thông tin (sản phẩm VÀ farm đi kèm)
    //         grpcResponse = await this.productsGrpcClientService.getListProducts(itemsToFetchDetailsFor.map(item => item.product_id));
    //         console.log('product_ids:', itemsToFetchDetailsFor.map(item => item.product_id));

    //     } catch (error) {
    //         this.logger.error('Failed to fetch product details from gRPC service:', error);
    //         itemsToFetchDetailsFor.forEach(reqItem => {
    //             result.issues.push({
    //                 reason: 'SERVICE_UNAVAILABLE_FOR_PRODUCT_DETAILS',
    //                 requested_product_id: reqItem.product_id,
    //                 details: `Failed to retrieve product information: ${(error as Error).message}`
    //             });
    //         });
    //         result.isValidOrder = false;
    //         return result;
    //     }

    //     // --- Bước 4: Xử lý kết quả gRPC và thu thập thông tin Farm duy nhất ---
    //     const actualProductsMap = new Map<number, { product: Product, farm: Farm | null }>();
    //     const uniqueFarmsMap = new Map<string, any>(); // Map<string, GrpcFarm>
    //     this.logger.log(`Products found: ${JSON.stringify(grpcResponse, null, 2)}`);
    //     if (grpcResponse && Array.isArray(grpcResponse)) {
    //         for (const productResp of grpcResponse) {
    //             if (productResp && typeof productResp.product_id === 'number') {
    //                 // Lưu thông tin sản phẩm để tra cứu
    //                 actualProductsMap.set(productResp.product_id, {
    //                     product: productResp,
    //                     farm: (productResp.farm ? productResp.farm : null)
    //                 });

    //                 // Thu thập thông tin Farm duy nhất để kiểm tra
    //                 if (productResp.farm && productResp.farm.farm_id && !uniqueFarmsMap.has(productResp.farm.farm_id)) {
    //                     uniqueFarmsMap.set(productResp.farm.farm_id, productResp.farm);
    //                 }
    //             }
    //         }
    //     }

    //     // --- Bước 5: Kiểm tra tính hợp lệ của các Farm ---
    //     // Thay vì gọi lại gRPC GetFarm, chúng ta sử dụng thông tin Farm đã có từ GetListProducts
    //     const validatedFarmsStatus = new Map<string, boolean>(); // Map<farm_id, isValid>

    //     for (const [farmId, farmData] of uniqueFarmsMap.entries()) {
    //         let isFarmValid = true;

    //         // 5.1 Kiểm tra trạng thái Farm (APPROVED)
    //         // Sử dụng EnumMapper của bạn như trong hàm validateFarmForOrder
    //         const grpcFarmStatus = farmData.status;
    //         this.logger.log(`Validating Farm ID ${farmId} with status: ${JSON.stringify(farmData,null, 2)}`);
    //         if (grpcFarmStatus !== FarmStatus.APPROVED) {
    //             this.logger.warn(`Farm ID ${farmId} is not approved. Status: ${grpcFarmStatus}`);
    //             result.issues.push({
    //                 reason: 'FARM_NOT_APPROVED',
    //                 farm_id: farmId,
    //                 details: `Farm is not in APPROVED status. Current status: ${grpcFarmStatus}.`
    //             });
    //             isFarmValid = false;
    //         }

    //         // 5.2 Kiểm tra địa chỉ Farm
    //         // (Bạn cần tự định nghĩa logic kiểm tra địa chỉ, đây là ví dụ)
    //         if (!farmData.address) { // Giả sử có trường full_address
    //             this.logger.warn(`Farm ID ${farmId} has invalid address.`);
    //             result.issues.push({
    //                 reason: 'FARM_ADDRESS_INVALID',
    //                 farm_id: farmId,
    //                 details: 'Farm address information is missing or incomplete.'
    //             });
    //             isFarmValid = false;
    //         }


    //         // 5.3 Kiểm tra cấu hình GHN (Giao Hàng Nhanh)
    //         // (Bạn cần tự định nghĩa logic kiểm tra GHN, đây là ví dụ)
    //         if (!farmData.address.address_ghn) { 
    //             this.logger.warn(`Farm ID ${farmId} has invalid GHN configuration.`);
    //             result.issues.push({
    //                 reason: 'FARM_GHN_CONFIG_MISSING',
    //                 farm_id: farmId,
    //                 details: 'Farm is not configured for GHN delivery (missing shop_id).'
    //             });
    //             isFarmValid = false;
    //         }

    //         // Lưu lại trạng thái validation của farm này
    //         validatedFarmsStatus.set(farmId, isFarmValid);
    //     }

    //     // --- Bước 6: Kiểm tra từng sản phẩm (Tồn kho, Trạng thái, Farm của nó) ---
    //     for (const requestedItem of itemsToFetchDetailsFor) {
    //         const actualProductData = actualProductsMap.get(requestedItem.product_id);

    //         // 6.1 Kiểm tra sản phẩm có tồn tại không
    //         if (!actualProductData || !actualProductData.product) {
    //             result.issues.push({
    //                 reason: 'PRODUCT_NOT_FOUND',
    //                 requested_product_id: requestedItem.product_id,
    //                 details: 'Product details not returned by the product service.'
    //             });
    //             continue;
    //         }

    //         const actualProduct = actualProductData.product;
    //         const farmId = actualProduct.farm?.farm_id;

    //         // 6.2 Kiểm tra xem Farm của sản phẩm này có hợp lệ không (đã kiểm tra ở Bước 5)
    //         if (!farmId || validatedFarmsStatus.get(farmId) === false) {
    //             result.issues.push({
    //                 reason: 'PRODUCT_BELONGS_TO_INVALID_FARM',
    //                 requested_product_id: requestedItem.product_id,
    //                 farm_id: farmId,
    //                 details: 'The farm selling this product is invalid, not approved, or missing farm_id.'
    //             });
    //             continue;
    //         }

    //         // 6.3 Kiểm tra trạng thái sản phẩm (Giả sử bạn có một EnumMapper cho ProductStatus)
    //         const productStatus = actualProduct.status;
    //         this.logger.log(`Product ID ${requestedItem.product_id} status: ${productStatus}`);
    //         if (productStatus !== ProductStatus.PRE_ORDER && productStatus !== ProductStatus.OPEN_FOR_SALE) {
    //             result.issues.push({
    //                 reason: 'PRODUCT_INACTIVE_OR_UNAVAILABLE',
    //                 requested_product_id: requestedItem.product_id,
    //                 details: `Product status is ${productStatus}, not ACTIVE.`
    //             });
    //             continue;
    //         }

    //         // 6.4 Kiểm tra số lượng tồn kho
    //         if (actualProduct.stock_quantity < requestedItem.quantity) {
    //             result.issues.push({
    //                 reason: 'INSUFFICIENT_STOCK',
    //                 requested_product_id: requestedItem.product_id,
    //                 requested_quantity: requestedItem.quantity,
    //                 available_stock: actualProduct.stock_quantity,
    //                 details: 'Insufficient stock for the requested quantity.'
    //             });
    //             continue;
    //         }

    //         // --- Nếu mọi thứ đều ổn, thêm vào danh sách hợp lệ ---
    //         result.validOrderItems.push({
    //             product_id: actualProduct.product_id,
    //             product_name: actualProduct.product_name,
    //             quantity: requestedItem.quantity,
    //             price_per_unit: actualProduct.price_per_unit, // Lấy giá thực tế
    //             total_price: requestedItem.quantity * actualProduct.price_per_unit,
    //             farm_id: farmId,
    //             farm_name: actualProductData.farm?.farm_name ?? "",
    //             // ... thêm các thông tin cần thiết khác
    //         });
    //     }

    //     // --- Bước 7: Xác định kết quả cuối cùng ---
    //     // Đơn hàng chỉ hợp lệ nếu không có bất kỳ issue nào (từ User, Farm, Product)
    //     // và có ít nhất một sản phẩm được yêu cầu (nếu ban đầu danh sách không rỗng)
    //     if (result.issues.length === 0) {
    //         // Nếu không có issue, kiểm tra xem có sản phẩm hợp lệ nào không (nếu có yêu cầu sản phẩm)
    //         if (userRequestList.length > 0 && result.validOrderItems.length > 0) {
    //             result.isValidOrder = true;
    //         } else if (userRequestList.length === 0) {
    //             // Trường hợp không yêu cầu sản phẩm nào (có thể là đơn hàng chỉ có phí ship?)
    //             // Tùy logic của bạn, ở đây coi là hợp lệ nếu không có lỗi user.
    //             result.isValidOrder = true;
    //         }
    //     } else {
    //         result.isValidOrder = false;
    //     }

    //     if (result.isValidOrder) {
    //         this.logger.log('Order validation successful.');
    //     } else {
    //         this.logger.warn(`Order validation failed with ${result.issues.length} issues.`);
    //     }

    //     return result;
    // }

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
            shipping_fee: 0, // Sẽ cập nhật sau khi tính toán
            avatar_url: farmResponse.avatar_url,
            final_fee: 0, // Sẽ cập nhật sau khi tính toán
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
                quantity: requestedItem.quantity,
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
            resultValidation.final_fee = totalFee;
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

}
