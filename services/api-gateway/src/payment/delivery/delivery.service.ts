import { firstValueFrom } from 'rxjs';
import { PaymentServiceClient } from '@farmera/grpc-proto/dist/payment/payment';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CalculateDeliveryRequestDto } from './dto/calculate-delivery.dto';
import { ErrorMapper } from 'src/mappers/common/error.mapper';

@Injectable()
export class DeliveryService implements OnModuleInit {
    private readonly logger = new Logger(DeliveryService.name);
    private deliveryGrpcService: PaymentServiceClient;
    constructor(
        @Inject('PAYMENT_PACKAGE') private readonly clientGrpcInstance: ClientGrpc,
    ) {
        
    }
    onModuleInit() {
        this.deliveryGrpcService = this.clientGrpcInstance.getService<PaymentServiceClient>("PaymentService");
    }
    async calculateShippingFee(userId: string, calculateDeliveryRequestDto: CalculateDeliveryRequestDto): Promise<any> {
        try {

            const result = await firstValueFrom(this.deliveryGrpcService.calculateShippingFee({
                suborders: {
                    farm_id: calculateDeliveryRequestDto.suborders.farm_id,
                    products: calculateDeliveryRequestDto.suborders.products.map(product => ({
                        product_id: product.product_id,
                        quantity: product.quantity,
                    })),
                },
                order_info: {
                    user_id: userId,
                    address_id: calculateDeliveryRequestDto.order_info.address_id,
                }
            }));
            return result; // chưa map 
            
        }
        catch (error) {
            this.logger.error('Error in calculateShippingFee:', error);
            throw ErrorMapper.fromGrpcError(error);
        }
    }
}
