import { Module } from '@nestjs/common';
import { PaymentGrpcController } from './payment-grpc.controller';
import { DeliveryModule } from 'src/delivery/delivery.module';
import { OrdersModule } from 'src/orders/orders.module';
import { BusinessValidationModule } from 'src/business-validation/business-validation.module';
import { PaymentModule } from 'src/payments/payment.module';
import { PayOSModule } from 'src/payos/payos.module';

@Module({
  imports: [
    DeliveryModule,
    OrdersModule,
    PaymentModule,
    BusinessValidationModule,
    PayOSModule,
  ],
  controllers: [PaymentGrpcController],
})
export class PaymentGrpcServerModule {}
