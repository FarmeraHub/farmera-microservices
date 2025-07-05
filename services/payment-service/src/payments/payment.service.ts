import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { Payment } from "./entities/payment.entity";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { Order } from "src/orders/entities/order.entity";
import { PaymentStatus } from "src/common/enums/payment/payment.enum";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    
    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
        private readonly configService: ConfigService,
    ) {
       

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