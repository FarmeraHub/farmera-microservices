import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Delivery } from "./enitites/delivery.entity";
import { EntityManager, Repository } from "typeorm";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { CalculateShippingFeeDto } from "./dto/calculate-shipping-fee.dto";
import { catchError, firstValueFrom, map } from "rxjs";
import { GhnFeeData, GhnFeeResponseDto } from "./dto/ghn-fee-response.dto";
import { AxiosError } from "axios";
import { GhnCreatedOrderDataDto, GhnCreateOrderResponseDto } from "./dto/ghn-order-response.dto";
import { CreateGhnOrderDto } from "./dto/ghnn-create-delivery.dto";
import { CancelDeliveryDto, GhnCancelDeliveryDto, GhnCancelResponseDto } from "./dto/cancel-delivery.dto";
import { SubOrder } from "src/orders/entities/sub-order.entity";
import { DeliveryStatus } from "src/common/enums/payment/delivery.enum";
import { GhnServiceTypeId } from "src/common/enums/payment/ghn.enum";
import { BusinessValidationService } from 'src/business-validation/business-validation.service';
import { GhnService } from 'src/ghn/ghn.service';
import { ItemDto } from "src/business-validation/dto/list-product.dto";
import { CheckAvailabilityResult, OrderDetail } from "src/business-validation/dto/validate-response.dto";
import { UserGrpcClientService } from "src/grpc/client/user.service";
import { Location } from "src/user/entities/location.entity";
import { CalculateShippingFeeRequestDto } from "src/orders/dto/order_dto";
import { ItemDeliveryDto } from "./dto/item-delivery.dto";
import { Issue, Item, ShippingFeeDetails } from "./enitites/cart.entity";
import { User } from "src/user/entities/user.entity";
export interface CreatePendingDeliveryInternalDto {
    shipping_fee_from_sub_order_dto: number; // Phí ship FE gửi cho sub-order này
    farm_id: string; // Để biết địa chỉ gửi
    // Thông tin người nhận sẽ lấy từ Order chính
    receiver_name: string;
    receiver_phone: string;
    to_address: string;
    to_ward_name: string;
    to_district_name: string;
    to_city_name: string;
}
@Injectable()
export class DeliveryService {
    private readonly logger = new Logger(DeliveryService.name);
    private ghnToken: string;
    private ghnShopId: number;
    private ghnUrlCalculateDeliveryFee: string;
    private ghnUrlCreateOrder: string;
    private ghnUrlCancelOrder: string;
    constructor(
        @InjectRepository(Delivery)
        private readonly deliveryRepository: Repository<Delivery>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly businessValidationService: BusinessValidationService,
        private readonly ghnService: GhnService,
        private readonly userGrpcClientService: UserGrpcClientService,
    ) {
        const GHN_TOKEN = this.configService.get<string>('GHN_TOKEN');
        const GHN_SHOP_ID = this.configService.get<number>('GHN_SHOP_ID');
        const GHN_CALCULATE_FEE_URL = this.configService.get<string>('GHN_CALCULATE_FEE_URL');
        const GHN_CREATE_ORDER = this.configService.get<string>('GHN_CREATE_ORDER_URL');
        const GHN_CANCEL_ORDER = this.configService.get<string>('GHN_CANCEL_ORDER_URL');
        if (!GHN_TOKEN || !GHN_SHOP_ID || !GHN_CALCULATE_FEE_URL || !GHN_CREATE_ORDER || !GHN_CANCEL_ORDER) {
            this.logger.error('Missing GHN configuration');
            throw new Error('Missing GHN configuration');
        }
        this.ghnToken = GHN_TOKEN;
        this.ghnShopId = GHN_SHOP_ID;
        this.ghnUrlCalculateDeliveryFee = GHN_CALCULATE_FEE_URL;
        this.ghnUrlCreateOrder = GHN_CREATE_ORDER;
        this.ghnUrlCancelOrder = GHN_CANCEL_ORDER;
    }

    async calculateFeeByGHN(calculateDto: CalculateShippingFeeDto): Promise<GhnFeeData> {


        const headers = {
            'Content-Type': 'application/json',
            'Token': this.ghnToken,
            'ShopId': this.ghnShopId,
        };

        this.logger.log(`[GHN Fee] Calling GHN Fee API for: ${JSON.stringify(calculateDto)}`);
        this.logger.debug(`[GHN Fee] Headers: Token: ${this.ghnToken.substring(0, 5)}..., ShopId: ${this.ghnShopId}`);


        let service_type_id: number;
        let finalWeight: number = 0;
        if (calculateDto.items && calculateDto.items.length > 0) {
            for (const item of calculateDto.items) {
                if (item.weight !== undefined && item.quantity !== undefined) {
                    finalWeight = item.weight * item.quantity;
                } else {
                    this.logger.warn(`[GHN Fee] Item is missing weight or quantity: ${JSON.stringify(item)}`);
                    throw new BadRequestException('Mỗi sản phẩm phải có trọng lượng (weight) và số lượng (quantity).');
                }
            }
        }

        if ((calculateDto.length ?? 0) > 150 || (calculateDto.width ?? 0) > 150 || (calculateDto.height ?? 0) > 150 || calculateDto.weight > 20000 || finalWeight > 20000) {
            service_type_id = GhnServiceTypeId.HANG_NANG;
        }
        else {
            service_type_id = GhnServiceTypeId.HANG_NHE;
        }
        const dto = {
            ...calculateDto,
            service_type_id: service_type_id
        }

        try {
            const response = await firstValueFrom(
                this.httpService.post<GhnFeeResponseDto>(this.ghnUrlCalculateDeliveryFee, dto, { headers }).pipe(
                    map(axiosResponse => {
                        this.logger.debug(`[GHN Fee] Raw response from GHN: ${JSON.stringify(axiosResponse.data)}`);
                        const ghnData = axiosResponse.data;

                        if (!ghnData || typeof ghnData.code !== 'number') {
                            this.logger.error('[GHN Fee] Unexpected response structure from GHN (missing code).');
                            throw new InternalServerErrorException('Phản hồi không mong đợi từ dịch vụ tính phí GHN.');
                        }

                        if (ghnData.code === 200) {
                            if (!ghnData.data) {
                                this.logger.warn('[GHN Fee] GHN Success but no fee data found.');
                                throw new BadRequestException('Không thể tính phí vận chuyển từ GHN (không có dữ liệu phí).');
                            }
                            this.logger.log(`[GHN Fee] Successfully calculated fee.`);
                            return ghnData.data;
                        } else {
                            // Xử lý các mã lỗi khác từ GHN
                            const errorMessage = ghnData.message || `GHN API returned an error.`;
                            this.logger.error(`[GHN Fee] GHN API error. Code: ${ghnData.code}, Message: ${errorMessage}`);
                            throw new BadRequestException(`${errorMessage} (GHN Code: ${ghnData.code})`);
                        }
                    }),
                    catchError((error: any) => {
                        if (error instanceof HttpException) {
                            throw error;
                        }
                        if (error instanceof AxiosError) {
                            let statusCodeToThrow = 500;
                            let errorMessageToThrow = 'Lỗi không mong đợi khi giao tiếp với dịch vụ GHN.';
                            if (error.response) {
                                const status = error.response.status;
                                let specificGhnMessage: string | null = null;
                                if (error.response.data && typeof error.response.data === 'object') {
                                    const responseData = error.response.data as any;
                                    // GHN có thể trả về lỗi trong `message` hoặc `error_message` hoặc các trường khác
                                    specificGhnMessage = responseData.message || responseData.error_message || responseData.code_message_value || (typeof responseData === 'string' ? responseData : null);
                                } else if (typeof error.response.data === 'string') {
                                    specificGhnMessage = error.response.data;
                                }

                                this.logger.error(`[GHN Fee] Axios error from GHN. Status: ${status}, Data: ${JSON.stringify(error.response.data)}`);

                                if (status === 400) { // Bad Request từ GHN (thường do dữ liệu đầu vào sai)
                                    statusCodeToThrow = 400;
                                    errorMessageToThrow = specificGhnMessage || 'Dữ liệu gửi đến GHN không hợp lệ.';
                                } else if (status === 401 || status === 403) { // Unauthorized/Forbidden (Token, ShopId sai)
                                    statusCodeToThrow = 500; // Hoặc 401/403 tùy bạn muốn client xử lý thế nào
                                    errorMessageToThrow = 'Lỗi xác thực với dịch vụ GHN. Vui lòng kiểm tra Token/ShopId.';
                                } else { // Các lỗi HTTP khác
                                    statusCodeToThrow = 500;
                                    errorMessageToThrow = `Dịch vụ GHN gặp lỗi (Status ${status}). ${specificGhnMessage ? `Chi tiết: ${specificGhnMessage}` : 'Không có chi tiết.'}`;
                                }
                            } else if (error.request) {
                                this.logger.error('[GHN Fee] No response received from GHN service.', error.stack);
                                statusCodeToThrow = 502; // Bad Gateway
                                errorMessageToThrow = 'Không thể kết nối hoặc nhận phản hồi từ dịch vụ GHN.';
                            } else {
                                this.logger.error(`[GHN Fee] Error setting up request to GHN service: ${error.message}`, error.stack);
                                statusCodeToThrow = 500;
                                errorMessageToThrow = `Lỗi khi chuẩn bị yêu cầu đến dịch vụ GHN: ${error.message}`;
                            }
                            switch (statusCodeToThrow) {
                                case 400: throw new BadRequestException(errorMessageToThrow);
                                case 502: throw new HttpException(errorMessageToThrow, 502);
                                default: throw new InternalServerErrorException(errorMessageToThrow);
                            }
                        }
                        this.logger.error(`[GHN Fee] Unknown error during GHN Fee API call.`, error.stack);
                        throw new InternalServerErrorException('Lỗi không xác định khi tính phí vận chuyển GHN.');
                    }),
                ),
            );
            return response;
        } catch (error) {
            this.logger.error(`[GHN Fee] Failed to calculate shipping fee: ${error.message}`, error.stack);
            throw error;
        }
    }
    async createOrderByGHN(createOrderDto: CreateGhnOrderDto): Promise<GhnCreatedOrderDataDto> {

        const headers = {
            'Content-Type': 'application/json',
            'Token': this.ghnToken,
            'ShopId': this.ghnShopId,
        };

        let service_type_id: number;
        let finalWeight: number = 0;
        if (createOrderDto.items && createOrderDto.items.length > 0) {
            for (const item of createOrderDto.items) {
                if (item.weight !== undefined && item.quantity !== undefined) {
                    finalWeight = item.weight * item.quantity;
                } else {
                    this.logger.warn(`[GHN Fee] Item is missing weight or quantity: ${JSON.stringify(item)}`);
                    throw new BadRequestException('Mỗi sản phẩm phải có trọng lượng (weight) và số lượng (quantity).');
                }
            }
        }

        if ((createOrderDto.length ?? 0) > 150 || (createOrderDto.width ?? 0) > 150 || (createOrderDto.height ?? 0) > 150 || createOrderDto.weight > 20000 || finalWeight > 20000) {
            service_type_id = GhnServiceTypeId.HANG_NANG;
        }
        else {
            service_type_id = GhnServiceTypeId.HANG_NHE;
        }
        const dto = {
            ...createOrderDto,
            service_type_id: service_type_id
        }


        this.logger.log(`[GHN Create Order] Calling API for client_order_code: ${createOrderDto.client_order_code || 'N/A'}`);
        this.logger.debug(`[GHN Create Order] Payload: ${JSON.stringify(createOrderDto)}`);
        this.logger.debug(`[GHN Create Order] Headers: Token: ${this.ghnToken.substring(0, 5)}..., ShopId: ${this.ghnShopId}`);


        try {
            const response = await firstValueFrom(
                this.httpService.post<GhnCreateOrderResponseDto>(this.ghnUrlCreateOrder, dto, { headers }).pipe(
                    map(axiosResponse => {
                        this.logger.debug(`[GHN Create Order] Raw response from GHN: ${JSON.stringify(axiosResponse.data)}`);
                        const ghnResponse = axiosResponse.data;

                        if (!ghnResponse || typeof ghnResponse.code !== 'number') {
                            this.logger.error('[GHN Create Order] Unexpected response structure from GHN (missing code).');
                            throw new InternalServerErrorException('Phản hồi không mong đợi từ dịch vụ tạo đơn GHN.');
                        }

                        if (ghnResponse.code === 200) { // Thành công
                            if (!ghnResponse.data || !ghnResponse.data.order_code) {
                                this.logger.warn('[GHN Create Order] GHN Success but no order data or order_code found.');
                                throw new InternalServerErrorException('Tạo đơn GHN thành công nhưng không nhận được dữ liệu đơn hàng.');
                            }
                            this.logger.log(`[GHN Create Order] Successfully created order. GHN Order Code: ${ghnResponse.data.order_code}`);
                            return ghnResponse.data;
                        } else {
                            const errorMessage = ghnResponse.message || ghnResponse.message_display || `GHN API returned an error.`;
                            this.logger.error(`[GHN Create Order] GHN API error. Code: ${ghnResponse.code}, Message: ${errorMessage}, Full Response: ${JSON.stringify(ghnResponse)}`);
                            throw new BadRequestException(`${errorMessage} (GHN Code: ${ghnResponse.code})`);
                        }
                    }),
                    catchError((error: any) => {
                        if (error instanceof HttpException) {
                            throw error;
                        }
                        if (error instanceof AxiosError) {
                            let statusCodeToThrow = 500;
                            let errorMessageToThrow = 'Lỗi không mong đợi khi giao tiếp với dịch vụ GHN.';
                            if (error.response) {
                                const status = error.response.status;
                                let specificGhnMessage: string | null = null;
                                if (error.response.data) {
                                    const responseData = error.response.data as any;
                                    specificGhnMessage = responseData.message_display || responseData.message || (responseData.data && responseData.data.message) || (typeof responseData === 'string' ? responseData : null);
                                    if (responseData.errors && typeof responseData.errors === 'object') { // Nếu GHN trả về lỗi validation chi tiết
                                        const validationErrors = Object.values(responseData.errors).flat().join('; ');
                                        specificGhnMessage = specificGhnMessage ? `${specificGhnMessage}. Details: ${validationErrors}` : `Validation errors: ${validationErrors}`;
                                    }
                                } else if (typeof error.response.data === 'string') {
                                    specificGhnMessage = error.response.data;
                                }

                                this.logger.error(`[GHN Create Order] Axios error from GHN. Status: ${status}, Data: ${JSON.stringify(error.response.data)}`);

                                if (status === 400) {
                                    statusCodeToThrow = 400;
                                    errorMessageToThrow = specificGhnMessage || 'Dữ liệu gửi đến GHN không hợp lệ để tạo đơn hàng.';
                                } else if (status === 401 || status === 403) {
                                    statusCodeToThrow = 500;
                                    errorMessageToThrow = 'Lỗi xác thực với dịch vụ GHN (Token/ShopId).';
                                } else {
                                    statusCodeToThrow = 500;
                                    errorMessageToThrow = `Dịch vụ GHN gặp lỗi HTTP (Status ${status}). ${specificGhnMessage ? `Chi tiết: ${specificGhnMessage}` : 'Không có chi tiết.'}`;
                                }
                            } else if (error.request) {
                                this.logger.error('[GHN Create Order] No response received from GHN service.', error.stack);
                                statusCodeToThrow = 502;
                                errorMessageToThrow = 'Không thể kết nối hoặc nhận phản hồi từ dịch vụ GHN.';
                            } else {
                                this.logger.error(`[GHN Create Order] Error setting up request to GHN service: ${error.message}`, error.stack);
                                statusCodeToThrow = 500;
                                errorMessageToThrow = `Lỗi khi chuẩn bị yêu cầu đến dịch vụ GHN: ${error.message}`;
                            }
                            switch (statusCodeToThrow) {
                                case 400: throw new BadRequestException(errorMessageToThrow);
                                case 502: throw new HttpException(errorMessageToThrow, 502);
                                default: throw new InternalServerErrorException(errorMessageToThrow);
                            }
                        }
                        this.logger.error(`[GHN Create Order] Unknown error during GHN Create Order API call.`, error.stack);
                        throw new InternalServerErrorException('Lỗi không xác định khi tạo đơn hàng GHN.');
                    }),
                ),
            );
            return response;
        } catch (error) {
            this.logger.error(`[GHN Create Order] Failed to create GHN order: ${error.message}`, error.stack);
            throw error;
        }
    }
    async cancelOrdesrByGHN(cancelDto: CancelDeliveryDto): Promise<GhnCancelDeliveryDto[]> {

        if (!cancelDto.order_codes || cancelDto.order_codes.length === 0) {
            this.logger.warn('[GHN Cancel Order] No order codes provided for cancellation.');
            throw new BadRequestException('Phải cung cấp ít nhất một mã vận đơn GHN để hủy.');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Token': this.ghnToken,
            'ShopId': this.ghnShopId,
        };

        const payload = {
            order_codes: cancelDto.order_codes
        };

        this.logger.log(`[GHN Cancel Order] Calling API to cancel orders: ${payload.order_codes.join(', ')}`);
        this.logger.debug(`[GHN Cancel Order] Payload: ${JSON.stringify(payload)}`);
        this.logger.debug(`[GHN Cancel Order] Headers: Token: ${this.ghnToken ? 'Present' : 'MISSING!'}, ShopId: ${this.ghnShopId || 'MISSING!'}`);

        try {
            const cancellationResults = await firstValueFrom(
                this.httpService.post<GhnCancelResponseDto>(this.ghnUrlCancelOrder, payload, { headers }).pipe(
                    map(axiosResponse => {
                        this.logger.debug(`[GHN Cancel Order] Raw response from GHN: ${JSON.stringify(axiosResponse.data)}`);
                        const ghnResponse = axiosResponse.data;

                        if (!ghnResponse || typeof ghnResponse.code !== 'number') {
                            this.logger.error('[GHN Cancel Order] Unexpected response structure from GHN (missing code or invalid structure).');
                            throw new InternalServerErrorException('Phản hồi không mong đợi từ dịch vụ hủy đơn GHN.');
                        }

                        if (ghnResponse.code === 200) { // Mã thành công chung của GHN
                            if (!ghnResponse.data || !Array.isArray(ghnResponse.data)) {
                                this.logger.warn('[GHN Cancel Order] GHN success code 200 but no data array or invalid data array found for cancellation results.');
                                throw new InternalServerErrorException('Hủy đơn GHN thành công (code 200) nhưng không nhận được danh sách kết quả chi tiết hợp lệ.');
                            }
                            this.logger.log(`[GHN Cancel Order] Successfully processed cancel request by GHN. Individual results: ${JSON.stringify(ghnResponse.data)}`);
                            ghnResponse.data.forEach(item => {
                                if (!item.result) {
                                    this.logger.warn(`[GHN Cancel Order] Failed to cancel order ${item.order_code} via GHN: ${item.message}`);
                                }
                            });
                            return ghnResponse.data;
                        } else {
                            const errorMessage = ghnResponse.code_message || ghnResponse.message || 'GHN API returned an error during cancellation.';
                            this.logger.error(`[GHN Cancel Order] GHN API error. Code: ${ghnResponse.code}, Message: ${errorMessage}, Full Response: ${JSON.stringify(ghnResponse)}`);
                            if (ghnResponse.code === 400 || ghnResponse.code === 403 || ghnResponse.code === 404) { // Ví dụ
                                throw new BadRequestException(`${errorMessage} (GHN Code: ${ghnResponse.code})`);
                            }
                            throw new InternalServerErrorException(`${errorMessage} (GHN Code: ${ghnResponse.code})`);
                        }
                    }),
                    catchError((error: any) => {
                        if (error instanceof HttpException) {
                            throw error;
                        }
                        if (error instanceof AxiosError) {

                            let statusCodeToThrow = 500;
                            let errorMessageToThrow = 'Lỗi không mong đợi khi giao tiếp với dịch vụ GHN.';
                            if (error.response) {
                                const status = error.response.status;
                                let specificGhnMessage: string | null = null;
                                if (error.response.data && typeof error.response.data === 'object') {
                                    const responseData = error.response.data as any;
                                    specificGhnMessage = responseData.message || responseData.error_message || responseData.code_message_value || (typeof responseData === 'string' ? responseData : null);
                                } else if (typeof error.response.data === 'string') {
                                    specificGhnMessage = error.response.data;
                                }

                                this.logger.error(`[GHN Cancel Ordel] Axios error from GHN. Status: ${status}, Data: ${JSON.stringify(error.response.data)}`);

                                if (status === 400) {
                                    statusCodeToThrow = 400;
                                    errorMessageToThrow = specificGhnMessage || 'Dữ liệu gửi đến GHN không hợp lệ.';
                                } else if (status === 401 || status === 403) {
                                    statusCodeToThrow = 500;
                                    errorMessageToThrow = 'Lỗi xác thực với dịch vụ GHN. Vui lòng kiểm tra Token/ShopId.';
                                } else {
                                    statusCodeToThrow = 500;
                                    errorMessageToThrow = `Dịch vụ GHN gặp lỗi (Status ${status}). ${specificGhnMessage ? `Chi tiết: ${specificGhnMessage}` : 'Không có chi tiết.'}`;
                                }
                            } else if (error.request) {
                                this.logger.error('[GHN Cancel Ordel] No response received from GHN service.', error.stack);
                                statusCodeToThrow = 502; // Bad Gateway
                                errorMessageToThrow = 'Không thể kết nối hoặc nhận phản hồi từ dịch vụ GHN.';
                            } else {
                                this.logger.error(`[GHN Cancel Ordel] Error setting up request to GHN service: ${error.message}`, error.stack);
                                statusCodeToThrow = 500;
                                errorMessageToThrow = `Lỗi khi chuẩn bị yêu cầu đến dịch vụ GHN: ${error.message}`;
                            }
                            switch (statusCodeToThrow) {
                                case 400: throw new BadRequestException(errorMessageToThrow);
                                case 502: throw new HttpException(errorMessageToThrow, 502);
                                default: throw new InternalServerErrorException(errorMessageToThrow);
                            }

                        }
                        this.logger.error(`[GHN Cancel Order] Unknown error during GHN Cancel Order API call. Error: ${JSON.stringify(error)}`, error.stack);
                        throw new InternalServerErrorException('Lỗi không xác định khi hủy đơn hàng GHN.');
                    }),
                ),
            );
            return cancellationResults;
        } catch (error) {
            this.logger.error(`[GHN Cancel Order] Overall failure to cancel GHN order(s): ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(`Không thể hoàn tất yêu cầu hủy đơn với GHN: ${error.message}`);
        }
    }

    async createPendingDeliveryWithManager(
        deliveryInput: CreatePendingDeliveryInternalDto,
        relatedSubOrder: SubOrder,
        manager: EntityManager,
    ): Promise<Delivery> {
        this.logger.debug(`[Delivery Save] Creating PENDING Delivery for SubOrder (to be ${relatedSubOrder.sub_order_id || 'new'}) for farm ${deliveryInput.farm_id}`);
        try {
            const deliveryToSave = manager.create(Delivery, {
                sub_order: relatedSubOrder,
                shipping_amount: deliveryInput.shipping_fee_from_sub_order_dto,
                status: DeliveryStatus.PENDING,
                delivery_provider_code: 'GHN',
                from_farm_id: deliveryInput.farm_id,
                to_name: deliveryInput.receiver_name,
                to_phone: deliveryInput.receiver_phone,
                to_address_detail: deliveryInput.to_address,
                to_ward_name: deliveryInput.to_ward_name,
                to_district_name: deliveryInput.to_district_name,
                to_city_name: deliveryInput.to_city_name,
                // ship_date, ghn_order_code sẽ null ban đầu
            });
            const savedDelivery = await manager.save(Delivery, deliveryToSave);
            this.logger.log(`[Delivery Save] Delivery ${savedDelivery.delivery_id} saved for SubOrder.`);
            return savedDelivery;
        } catch (error) {
            this.logger.error(`[Delivery Save] Error saving Delivery with manager: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`Lỗi khi tạo thông tin giao hàng: ${error.message}`);
        }
    }

    async CalculateShippingFee(order: CalculateShippingFeeRequestDto): Promise<ShippingFeeDetails | Issue[] > {
        this.logger.log(`Starting shipping fee calculation for order: ${JSON.stringify(order)}`);
        let allIssues: Issue[] = [];
        const [subOrderValidationResult, orderInfoValidationResult] = await Promise.all([
            this.businessValidationService.validateSubOrder(order.suborders),
            this.businessValidationService.validateOrderInfoToCalculateShippingFee(order.order_info)
        ]);
        let validSubOrder: ShippingFeeDetails | null = null;
        let validOrderInfo: { user: User, address: Location, province_code: number, district_code: number, ward_code: string } | null = null;


        if (Array.isArray(subOrderValidationResult)) {
            allIssues.push(...subOrderValidationResult);
        } else {
            validSubOrder = subOrderValidationResult;
        }
        if (Array.isArray(orderInfoValidationResult)) {
            allIssues.push(...orderInfoValidationResult);
        } else {
            validOrderInfo = orderInfoValidationResult;
        }

        if (allIssues.length > 0) {
           
            return allIssues;
        }

        if (validSubOrder && validOrderInfo) {
            try {
                const listItemDelivery: ItemDeliveryDto[] = validSubOrder.products.map((item: Item) => {
                    return {
                        name: item.product_name,
                        quantity: item.quantity,
                        weight: item.weight,
                        length: 0, // Việc tạo sản phẩm chưa có các trường này, nên tạm thời để 0
                        width: 0,
                        height: 0,
                        price: item.price_per_unit,
                    };
                })

                const calculateShippingFeeDto: CalculateShippingFeeDto = {
                    from_district_id: validSubOrder.district_code!,
                    from_ward_code: validSubOrder.ward_code!,
                    to_district_id: validOrderInfo.district_code,
                    to_ward_code: validOrderInfo.ward_code,
                    length: 0, // Tạm thời để 0
                    width: 0, // Tạm thời để 0
                    height: 0, // Tạm thời để 0
                    weight: validSubOrder.products.reduce((sum: number, item: Item) => sum + (item.weight * item.quantity), 0),
                    items: listItemDelivery,
                };
                const ghnFeeData = await this.calculateFeeByGHN(calculateShippingFeeDto);
                this.logger.log(`GHN Fee Data: ${JSON.stringify(ghnFeeData)}`);
                const shippingFeeDetails: ShippingFeeDetails = {
                    ...validSubOrder,
                    shipping_fee: ghnFeeData.total,
                    final_fee: ghnFeeData.total + validSubOrder.shipping_fee,
                };
                this.logger.log(`Calculated shipping fee details: ${JSON.stringify(shippingFeeDetails)}`);
                return shippingFeeDetails;

                
            } catch (error) { 
                this.logger.error(`Error calculating shipping fee: ${error.message}`, error.stack);
                throw new InternalServerErrorException(`Lỗi khi tính phí vận chuyển: ${error.message}`);
            }
        }
        this.logger.warn(`No valid suborder or order info found for shipping fee calculation.`);
        throw new BadRequestException('Không có thông tin hợp lệ để tính phí vận chuyển.');
    }

}