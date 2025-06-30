import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
    PaymentServiceClient,
} from "@farmera/grpc-proto/dist/payment/payment";
import { ClientGrpc } from "@nestjs/microservices";
import { OrderMapper } from "src/mappers/payment/order.mapper";
import { CalculateShippingFeeDto } from "./order/dto/calculate-shipping-fee-multi-item.dto";
@Injectable()
export class PaymentClientService implements OnModuleInit {
    private readonly logger = new Logger(PaymentClientService.name);
    private paymentServiceGrpcClient: PaymentServiceClient;
    constructor(
        @Inject('PAYMENT_PACKAGE') private readonly clientGrpcInstance: ClientGrpc,
    ) { }
    onModuleInit() {
        this.logger.log('PaymentClientService onModuleInit called.');
        this.paymentServiceGrpcClient = this.clientGrpcInstance.getService<PaymentServiceClient>('PaymentService');
        if (!this.paymentServiceGrpcClient) {
            this.logger.error('Failed to get PaymentService gRPC client on module init.');
            throw new Error('Critical: PaymentService gRPC client could not be initialized.');
        } else {
            this.logger.log('PaymentService gRPC client initialized successfully.');
        }
    } 
    async calculateShippingFee(calculateShippingFeeDto: CalculateShippingFeeDto, userId: string): Promise<any>{

        this.logger.log(`calculateShippingFee called with orderItems: ${JSON.stringify(calculateShippingFeeDto, null, 2)}`, 'userId:', userId, 'address_id:', calculateShippingFeeDto.address_id);
        try {
            const response = await this.paymentServiceGrpcClient.calculateShippingFee({
                list_items:  calculateShippingFeeDto.products.map(item => OrderMapper.toGrpcOrderItemRequest(item)),
                user_id: userId,
                address_id: calculateShippingFeeDto.address_id
            });
            this.logger.log('calculateShippingFee response:', response);
            return response;
        } catch (error) {
            this.logger.error('Error in calculateShippingFee:', error);
            throw error; // Re-throw the error for further handling
        }
    }
    

}
