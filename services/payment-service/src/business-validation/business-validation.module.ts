import { Module } from "@nestjs/common";
import { BusinessValidationService } from "./business-validation.service";
import { PaymentClientModule } from "src/grpc/client/payment-client.module";
import { GhnModule } from "src/ghn/ghn.module";

@Module({
    imports: [
        PaymentClientModule,
        GhnModule,
    ],
    
    controllers: [],
    providers: [BusinessValidationService],
    exports: [BusinessValidationService],
})
export class BusinessValidationModule { }