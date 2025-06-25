import { Injectable, Logger } from "@nestjs/common";
import { ProductsGrpcClientService } from "src/grpc/client/product.service";
import { UserGrpcClientService } from "src/grpc/client/user.service";
import { ItemDto } from "./dto/list-product.dto";
import { Product } from "src/product/product/entities/product.entity";

import { CheckAvailabilityResult, OrderDetail } from "./dto/validate-response.dto";
import { EnumMapper } from "src/mappers/common/enum.mapper";
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

@Injectable()
export class BusinessValidationService {
    private readonly logger = new Logger(BusinessValidationService.name);
    constructor(
        private readonly userGrpcClientService: UserGrpcClientService,
        private readonly productsGrpcClientService: ProductsGrpcClientService,

    ) { }

    async validateOrder(userRequestList: ItemDto[], orderDetails: OrderDetail): Promise<CheckAvailabilityResult> {
        const result: CheckAvailabilityResult = {
            isValidOrder: false,
            validOrderItems: [],
            issues: [],
        }

        // --- Bước 1: Kiểm tra User, Địa chỉ và Phương thức thanh toán (Mô tả & Comment) ---


        if (!orderDetails || !orderDetails.user_id) {
            result.issues.push({ reason: 'USER_ID_MISSING', details: 'User ID is required for the order.' });
        } else {
            try {
                // 1.1 Gọi User Service để kiểm tra người dùng có tồn tại và active không
                const user: User = await this.userGrpcClientService.getUser(orderDetails.user_id);
                if (!user || user.status !== UserStatus.ACTIVE) {
                    result.issues.push({ reason: 'USER_NOT_FOUND_OR_INACTIVE', user_id: orderDetails.user_id, details: 'User account is not active or does not exist.' });
                }

                // 1.2 Kiểm tra địa chỉ giao hàng có hợp lệ không
                // if (!orderDetails.shipping_address || !this.isValidAddress(orderDetails.shipping_address)) {
                //     result.issues.push({ reason: 'INVALID_SHIPPING_ADDRESS', user_id: orderDetails.user_id, details: 'Shipping address is missing or invalid.' });
                // }

                const userLocation: Location = await this.userGrpcClientService.getLocationById(orderDetails.address_id);
                this.logger.log(`User Location: ${JSON.stringify(userLocation, null, 2)}`);
                if (!userLocation || !userLocation.id || userLocation.user_id !== user.id || userLocation.user_id !== orderDetails.user_id) {
                    result.issues.push({
                        reason: 'INVALID_ADDRESS_ID',
                        user_id: orderDetails.user_id,
                        details: 'Address ID is invalid, does not exist, or does not belong to the specified user.'
                    });
                }




                // 1.3 Kiểm tra khả năng thanh toán nếu là thanh toán online
                // const onlineMethods = ['ONLINE_BANKING', 'E_WALLET']; // Định nghĩa các phương thức online
                // if (onlineMethods.includes(orderDetails.payment_method)) {
                //     // const canPayOnline = await this.userService.checkPaymentCapability(orderDetails.user_id);
                //     // if (!canPayOnline) {
                //     //    result.issues.push({ reason: 'USER_CANNOT_PAY_ONLINE', user_id: orderDetails.user_id, payment_method: orderDetails.payment_method, details: 'User is not allowed or configured for online payments.' });
                //     // }
                // }

            } catch (error) {
                this.logger.error('Error during user validation:', error);
                // Nếu không thể kết nối User Service
                result.issues.push({ reason: 'USER_VALIDATION_SERVICE_UNAVAILABLE', user_id: orderDetails.user_id, details: 'Could not validate user information due to service error.' });
            }
        }




        if (!Array.isArray(userRequestList) || userRequestList.length === 0) {
            this.logger.warn('User request list is empty or not an array.');
            // Nếu không có sản phẩm, không cần kiểm tra thêm về sản phẩm.
            // Chỉ trả về kết quả dựa trên kiểm tra user ở trên.
            result.isValidOrder = result.issues.length === 0; // True nếu không có lỗi user và không có sản phẩm
            return result;
        }

        const itemsToFetchDetailsFor: any[] = [];

        // --- Bước 2: Kiểm tra cấu trúc cơ bản của từng sản phẩm ---
        for (const requestedItem of userRequestList) {
            // Kiểm tra product_id
            if (!requestedItem || typeof requestedItem.product_id !== 'number' || isNaN(requestedItem.product_id)) {
                this.logger.warn(`Invalid product_id in user request: ${JSON.stringify(requestedItem)}`);
                result.issues.push({
                    reason: 'INVALID_PRODUCT_ID_FORMAT',
                    requested_product_id: requestedItem?.product_id || 0,
                    details: 'Product ID is missing or not a valid number.'
                });
                continue;
            }
            // Kiểm tra quantity
            if (typeof requestedItem.quantity !== 'number' || isNaN(requestedItem.quantity) || requestedItem.quantity <= 0) {
                this.logger.warn(`Invalid quantity in user request: ${JSON.stringify(requestedItem)}`);
                result.issues.push({
                    reason: 'INVALID_QUANTITY',
                    requested_product_id: requestedItem.product_id,
                    requested_quantity: requestedItem.quantity,
                    details: 'Quantity is missing, not a valid number, or not greater than zero.'
                });
                continue;
            }
            itemsToFetchDetailsFor.push(requestedItem);
        }

        if (itemsToFetchDetailsFor.length === 0) {
            this.logger.warn('No structurally valid items to fetch details for.');
            result.isValidOrder = result.issues.length === 0;
            return result;
        }

        // --- Bước 3: Lấy thông tin chi tiết sản phẩm và Farm từ Product Service ---
        let grpcResponse: Product[]; // GetListProductsResponse
        try {
            // Gọi hàm gốc của bạn để lấy thông tin (sản phẩm VÀ farm đi kèm)
            grpcResponse = await this.productsGrpcClientService.getListProducts(itemsToFetchDetailsFor.map(item => item.product_id));
            console.log('product_ids:', itemsToFetchDetailsFor.map(item => item.product_id));

        } catch (error) {
            this.logger.error('Failed to fetch product details from gRPC service:', error);
            itemsToFetchDetailsFor.forEach(reqItem => {
                result.issues.push({
                    reason: 'SERVICE_UNAVAILABLE_FOR_PRODUCT_DETAILS',
                    requested_product_id: reqItem.product_id,
                    details: `Failed to retrieve product information: ${(error as Error).message}`
                });
            });
            result.isValidOrder = false;
            return result;
        }

        // --- Bước 4: Xử lý kết quả gRPC và thu thập thông tin Farm duy nhất ---
        const actualProductsMap = new Map<number, { product: Product, farm: Farm | null }>();
        const uniqueFarmsMap = new Map<string, any>(); // Map<string, GrpcFarm>
        this.logger.log(`Products found: ${JSON.stringify(grpcResponse, null, 2)}`);
        if (grpcResponse && Array.isArray(grpcResponse)) {
            for (const productResp of grpcResponse) {
                if (productResp && typeof productResp.product_id === 'number') {
                    // Lưu thông tin sản phẩm để tra cứu
                    actualProductsMap.set(productResp.product_id, {
                        product: productResp,
                        farm: (productResp.farm ? productResp.farm : null)
                    });

                    // Thu thập thông tin Farm duy nhất để kiểm tra
                    if (productResp.farm && productResp.farm.farm_id && !uniqueFarmsMap.has(productResp.farm.farm_id)) {
                        uniqueFarmsMap.set(productResp.farm.farm_id, productResp.farm);
                    }
                }
            }
        }

        // --- Bước 5: Kiểm tra tính hợp lệ của các Farm ---
        // Thay vì gọi lại gRPC GetFarm, chúng ta sử dụng thông tin Farm đã có từ GetListProducts
        const validatedFarmsStatus = new Map<string, boolean>(); // Map<farm_id, isValid>

        for (const [farmId, farmData] of uniqueFarmsMap.entries()) {
            let isFarmValid = true;

            // 5.1 Kiểm tra trạng thái Farm (APPROVED)
            // Sử dụng EnumMapper của bạn như trong hàm validateFarmForOrder
            const grpcFarmStatus = farmData.status;
            this.logger.log(`Validating Farm ID ${farmId} with status: ${JSON.stringify(farmData,null, 2)}`);
            if (grpcFarmStatus !== FarmStatus.APPROVED) {
                this.logger.warn(`Farm ID ${farmId} is not approved. Status: ${grpcFarmStatus}`);
                result.issues.push({
                    reason: 'FARM_NOT_APPROVED',
                    farm_id: farmId,
                    details: `Farm is not in APPROVED status. Current status: ${grpcFarmStatus}.`
                });
                isFarmValid = false;
            }

            // 5.2 Kiểm tra địa chỉ Farm
            // (Bạn cần tự định nghĩa logic kiểm tra địa chỉ, đây là ví dụ)
            if (!farmData.address) { // Giả sử có trường full_address
                this.logger.warn(`Farm ID ${farmId} has invalid address.`);
                result.issues.push({
                    reason: 'FARM_ADDRESS_INVALID',
                    farm_id: farmId,
                    details: 'Farm address information is missing or incomplete.'
                });
                isFarmValid = false;
            }


            // 5.3 Kiểm tra cấu hình GHN (Giao Hàng Nhanh)
            // (Bạn cần tự định nghĩa logic kiểm tra GHN, đây là ví dụ)
            if (!farmData.address.address_ghn) { 
                this.logger.warn(`Farm ID ${farmId} has invalid GHN configuration.`);
                result.issues.push({
                    reason: 'FARM_GHN_CONFIG_MISSING',
                    farm_id: farmId,
                    details: 'Farm is not configured for GHN delivery (missing shop_id).'
                });
                isFarmValid = false;
            }

            // Lưu lại trạng thái validation của farm này
            validatedFarmsStatus.set(farmId, isFarmValid);
        }

        // --- Bước 6: Kiểm tra từng sản phẩm (Tồn kho, Trạng thái, Farm của nó) ---
        for (const requestedItem of itemsToFetchDetailsFor) {
            const actualProductData = actualProductsMap.get(requestedItem.product_id);

            // 6.1 Kiểm tra sản phẩm có tồn tại không
            if (!actualProductData || !actualProductData.product) {
                result.issues.push({
                    reason: 'PRODUCT_NOT_FOUND',
                    requested_product_id: requestedItem.product_id,
                    details: 'Product details not returned by the product service.'
                });
                continue;
            }

            const actualProduct = actualProductData.product;
            const farmId = actualProduct.farm?.farm_id;

            // 6.2 Kiểm tra xem Farm của sản phẩm này có hợp lệ không (đã kiểm tra ở Bước 5)
            if (!farmId || validatedFarmsStatus.get(farmId) === false) {
                result.issues.push({
                    reason: 'PRODUCT_BELONGS_TO_INVALID_FARM',
                    requested_product_id: requestedItem.product_id,
                    farm_id: farmId,
                    details: 'The farm selling this product is invalid, not approved, or missing farm_id.'
                });
                continue;
            }

            // 6.3 Kiểm tra trạng thái sản phẩm (Giả sử bạn có một EnumMapper cho ProductStatus)
            const productStatus = actualProduct.status;
            this.logger.log(`Product ID ${requestedItem.product_id} status: ${productStatus}`);
            if (productStatus !== ProductStatus.PRE_ORDER && productStatus !== ProductStatus.OPEN_FOR_SALE) {
                result.issues.push({
                    reason: 'PRODUCT_INACTIVE_OR_UNAVAILABLE',
                    requested_product_id: requestedItem.product_id,
                    details: `Product status is ${productStatus}, not ACTIVE.`
                });
                continue;
            }

            // 6.4 Kiểm tra số lượng tồn kho
            if (actualProduct.stock_quantity < requestedItem.quantity) {
                result.issues.push({
                    reason: 'INSUFFICIENT_STOCK',
                    requested_product_id: requestedItem.product_id,
                    requested_quantity: requestedItem.quantity,
                    available_stock: actualProduct.stock_quantity,
                    details: 'Insufficient stock for the requested quantity.'
                });
                continue;
            }

            // --- Nếu mọi thứ đều ổn, thêm vào danh sách hợp lệ ---
            result.validOrderItems.push({
                product_id: actualProduct.product_id,
                product_name: actualProduct.product_name,
                quantity: requestedItem.quantity,
                price_per_unit: actualProduct.price_per_unit, // Lấy giá thực tế
                total_price: requestedItem.quantity * actualProduct.price_per_unit,
                farm_id: farmId,
                farm_name: actualProductData.farm?.farm_name ?? "",
                // ... thêm các thông tin cần thiết khác
            });
        }

        // --- Bước 7: Xác định kết quả cuối cùng ---
        // Đơn hàng chỉ hợp lệ nếu không có bất kỳ issue nào (từ User, Farm, Product)
        // và có ít nhất một sản phẩm được yêu cầu (nếu ban đầu danh sách không rỗng)
        if (result.issues.length === 0) {
            // Nếu không có issue, kiểm tra xem có sản phẩm hợp lệ nào không (nếu có yêu cầu sản phẩm)
            if (userRequestList.length > 0 && result.validOrderItems.length > 0) {
                result.isValidOrder = true;
            } else if (userRequestList.length === 0) {
                // Trường hợp không yêu cầu sản phẩm nào (có thể là đơn hàng chỉ có phí ship?)
                // Tùy logic của bạn, ở đây coi là hợp lệ nếu không có lỗi user.
                result.isValidOrder = true;
            }
        } else {
            result.isValidOrder = false;
        }

        if (result.isValidOrder) {
            this.logger.log('Order validation successful.');
        } else {
            this.logger.warn(`Order validation failed with ${result.issues.length} issues.`);
        }

        return result;
    }
}
