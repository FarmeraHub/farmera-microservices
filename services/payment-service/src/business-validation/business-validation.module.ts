import { Module } from "@nestjs/common";
import { BusinessValidationService } from "./business-validation.service";
import { PaymentClientModule } from "src/grpc/client/payment-client.module";
import { BusinessValidationController } from "./business-validation.controller";

@Module({
    imports: [
        PaymentClientModule,
    ],
    controllers: [BusinessValidationController],
    providers: [BusinessValidationService],
    exports: [BusinessValidationService],
})
export class BusinessValidationModule { }