import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payment } from "./entities/payment.entity";
import { PaymentService } from "./payment.service";
import { Order } from "src/orders/entities/order.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment]),
    ],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule { }