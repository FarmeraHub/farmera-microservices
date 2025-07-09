import { OrderStatus } from "src/common/enums/payment/order-status.enum";

export class Order{
    order_id: number;
    customer_id: string;
    address_id: string;
    total_amount: number;
    shipping_amount: number;
    final_amount: number;
    created: Date;
    updated: Date;
    currency: string;
    status: OrderStatus;
}