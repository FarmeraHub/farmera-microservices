import { BaseOrderDto } from "./base-order.dto";

export class OrderDto extends BaseOrderDto { 
    customer_id: string;
    total_amount?: number;
    shipping_fee?: number;
    created?: Date;
    updated?: Date;
}