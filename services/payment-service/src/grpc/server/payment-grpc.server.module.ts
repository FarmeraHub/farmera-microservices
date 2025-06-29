import { Module } from "@nestjs/common";
import { PaymentGrpcController } from "./payment-grpc.controller";
import { DeliveryModule } from "src/delivery/delivery.module";
import { OrdersModule } from "src/orders/orders.module";
import { BusinessValidationModule } from "src/business-validation/business-validation.module";

@Module({
    imports: [
        DeliveryModule,
        OrdersModule,
        BusinessValidationModule,
        
    ],
    controllers: [PaymentGrpcController],
})
export class PaymentGrpcServerModule { }