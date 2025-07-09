import { PaymentMethod, PaymentStatus } from "src/common/enums/payment/payment.enum";
import { Order } from "src/payment/order/entities/order.entity";

export class Payment{
    payment_id: number;
    order?: Order;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    transaction_id?: string;
    paid_at?: Date;
    created: Date;
    updated: Date;
    currency: string;
    qr_code?: string; // Link hình ảnh QR code
    checkout_url?: string; // Link hình ảnh QR code
}