import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { Payment } from "./entities/payment.entity";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { Order } from "src/orders/entities/order.entity";
import { PaymentStatus } from "src/common/enums/payment/payment.enum";

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
    ) {
        // Initialize any dependencies or services here if needed
    }
    async create(payment: CreatePaymentDto, orderRoot: Order, transactionalManager: EntityManager): Promise<Payment> {
        const newPayment = transactionalManager.create(Payment, {
            order: orderRoot,
            amount: payment.amount,
            method: payment.method,
            status: payment.status ?? PaymentStatus.PENDING,
            transaction_id: payment.transaction_id ?? '',
            paid_at: payment.paid_at ? payment.paid_at : undefined,
            currency: payment.currency,
        });
        return transactionalManager.save(newPayment);
    }
}