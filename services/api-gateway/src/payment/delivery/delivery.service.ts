import { firstValueFrom, map } from 'rxjs';
import { PaymentServiceClient } from '@farmera/grpc-proto/dist/payment/payment';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CalculateDeliveryRequestDto } from './dto/calculate-delivery.dto';
import { ErrorMapper } from 'src/mappers/common/error.mapper';
import { ShippingDetail } from '../order/entities/shipping-detail.entity';
import { Issue } from '../order/entities/issue.entity';
import { IssueMapper } from 'src/mappers/payment/issue.mapper';
import { ShippingDetailMapper } from 'src/mappers/payment/shipping-detail.mapper';

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
    async calculateShippingFee(userId: string, calculateDeliveryRequestDto: CalculateDeliveryRequestDto): Promise<ShippingDetail| Issue []> {
        try {

            const result = await firstValueFrom(this.deliveryGrpcService.calculateShippingFee({
                suborder: {
                    farm_id: calculateDeliveryRequestDto.suborder.farm_id,
                    products: calculateDeliveryRequestDto.suborder.products.map(product => ({
                        product_id: product.product_id,
                        quantity: product.quantity,
                    })),
                },
                order_info: {
                    user_id: userId,
                    address_id: calculateDeliveryRequestDto.order_info.address_id,
                }
            }));
           if (result.errors && result.errors.issues && Array.isArray(result.errors.issues)) {
            const issues: Issue[] = result.errors.issues.map(issue => IssueMapper.fromGrpcIssue(issue));
            return issues;
        }
        if (Array.isArray(result)) {
            const issues: Issue[] = result.map(issue => IssueMapper.fromGrpcIssue(issue));
            return issues;
        }
        if (result.detail) {
            const shippingDetail = ShippingDetailMapper.fromGrpcShippingDetail(result.detail);
            return shippingDetail;
        }
        this.logger.error('Unknown response structure:', result);
        throw new Error('Invalid response structure from delivery service');

            
        }
        catch (error) {
            this.logger.error('Error in calculateShippingFee:', error);
            throw ErrorMapper.fromGrpcError(error);
        }
    }
}
