import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, Repository } from "typeorm";
import { Payment } from "./entities/payment.entity";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { Order } from "src/orders/entities/order.entity";
import { PaymentStatus } from "src/common/enums/payment/payment.enum";
import { ConfigService } from "@nestjs/config";
import { PayosWebhookDto } from "src/payos/dto/payos-webhook.dto";
import { OrderStatus } from "src/common/enums/payment/order-status.enum";
import { PayOSService } from "src/payos/payos.service";
@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
        private readonly configService: ConfigService,
        @InjectDataSource()
        private dataSource: DataSource,
        private readonly payOSService: PayOSService,
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
            qr_code: payment.qr_code ?? '',
            checkout_url: payment.checkout_url ?? '',
        });
        return transactionalManager.save(newPayment);
    }


    async handlePayOSCallback(data: PayosWebhookDto): Promise<boolean> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if (!this.validatePayOSCallbackData(data)) {
                await queryRunner.rollbackTransaction();
                return false;
            }
            const  verifySignature = await this.payOSService.verifySignature(data);
            if (!verifySignature) {
                this.logger.error(`PayOS signature verification failed for order: ${data.data.orderCode}`);
                await queryRunner.rollbackTransaction();
                return false;
            }
            const payment = await queryRunner.manager.findOne(Payment, {
                where: {
                    order: {
                        order_id: data.data.orderCode,
                    },
                    transaction_id: data.data.paymentLinkId,
                },
                relations: ['order']
            });

            if (!payment) {
                this.logger.error(`Payment not found for order: ${data.data.orderCode}, paymentLinkId: ${data.data.paymentLinkId}`);
                await queryRunner.rollbackTransaction();
                return false;
            }

            this.logger.log(`Processing PayOS callback for order ${data.data.orderCode}:`, {
                payment_amount: payment.amount,
                callback_amount: data.data.amount,
                current_status: payment.status,
                callback_desc: data.data.desc
            });

            if (payment.amount !== data.data.amount) {
                this.logger.error(`Amount mismatch for order ${data.data.orderCode}:`, {
                    expected: payment.amount,
                    received: data.data.amount
                });
                await queryRunner.rollbackTransaction();
                return false;
            }

            if (payment.status === PaymentStatus.COMPLETED) {
                this.logger.warn(`Payment already completed for order: ${data.data.orderCode}`);
                await queryRunner.commitTransaction();
                return true;
            }

            if (!this.isPaymentSuccessful(data)) {
                this.logger.warn(`Payment not successful for order ${data.data.orderCode}: ${data.data.desc}`);

                payment.status = PaymentStatus.FAILED;
                await queryRunner.manager.save(Payment, payment);
                await queryRunner.commitTransaction();
                return false;
            }

            payment.status = PaymentStatus.COMPLETED;
            payment.paid_at = new Date();

            const updatedPayment = await queryRunner.manager.save(Payment, payment);

            if (payment.order && payment.order.status !== 'PAID') {
                payment.order.status = OrderStatus.PAID;
                await queryRunner.manager.save(Order, payment.order);
                this.logger.log(`Order ${data.data.orderCode} status updated to PAID`);
            }

            await queryRunner.commitTransaction();

            this.logger.log(`Payment completed successfully for order: ${data.data.orderCode}`, {
                payment_id: updatedPayment.payment_id,
                amount: updatedPayment.amount,
                paid_at: updatedPayment.paid_at
            });

            return true;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error handling PayOS callback for order ${data?.data?.orderCode}:`, {
                error: error.message,
                stack: error.stack,
                data: data
            });
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private validatePayOSCallbackData(data: PayosWebhookDto): boolean {
        if (!data) {
            this.logger.error('PayOS callback data is null or undefined');
            return false;
        }

        if (data.code !== '00') {
            this.logger.error(`PayOS callback failed with code: ${data.code}`);
            return false;
        }

        if (!data.data || !data.data.orderCode || !data.data.paymentLinkId) {
            this.logger.error('PayOS callback missing required data fields:', data);
            return false;
        }

        if (!data.signature) {
            this.logger.error('PayOS callback missing signature');
            return false;
        }

        return true;
    }


    private isPaymentSuccessful(data: PayosWebhookDto): boolean {
        if (data.code !== '00') {
            return false;
        }

        const desc = data.data.desc?.toLowerCase() || '';
        const successKeywords = ['thành công', 'successful', 'completed', 'success'];

        return successKeywords.some(keyword => desc.includes(keyword));
    }



}