import { PaymentMethod, PaymentStatus } from "src/common/enums/payment/payment.enum";

export class CreatePaymentDto {
    method: PaymentMethod;
    amount: number;
    transaction_id?: string;
    currency: string;
    paid_at: Date | null;
    status?: PaymentStatus;
    qr_code?: string;
    checkout_url?: string; // Link hình ảnh QR code
}