import { Module } from "@nestjs/common";
import { Delivery } from "./enitites/delivery.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DeliveryController } from "./delivery.controller";
import { DeliveryService } from "./delivery.service";
import { HttpModule } from "@nestjs/axios";
import { BusinessValidationModule } from "src/business-validation/business-validation.module";
import { GhnModule } from "src/ghn/ghn.module";
import { PaymentClientModule } from "src/grpc/client/payment-client.module";

@Module({
    imports: [HttpModule,
        TypeOrmModule.forFeature([Delivery]),
        BusinessValidationModule,
        GhnModule,
        PaymentClientModule,
    ],
    controllers: [DeliveryController],
    providers: [DeliveryService],
    exports: [DeliveryService],
})
export class DeliveryModule { }