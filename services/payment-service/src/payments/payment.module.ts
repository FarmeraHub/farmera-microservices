import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payment } from "./entities/payment.entity";
import { PaymentService } from "./payment.service";
import { Order } from "src/orders/entities/order.entity";
import { PayOSModule } from "src/payos/payos.module";
import { PayOSService } from "src/payos/payos.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment]),
        PayOSModule,
    ],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule { }