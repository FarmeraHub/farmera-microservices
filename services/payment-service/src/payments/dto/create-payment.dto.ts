import { PaymentMethod, PaymentStatus } from "src/common/enums/payment/payment.enum";

export class CreatePaymentDto {
    method: PaymentMethod;
    amount: number;
    transaction_id?: string;
    currency: string;
    paid_at: Date;
    status?: PaymentStatus;
}