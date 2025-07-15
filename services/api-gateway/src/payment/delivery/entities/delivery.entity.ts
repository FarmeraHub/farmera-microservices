import { DeliveryStatus } from "src/common/enums/payment/delivery.enum";
import { SubOrder } from "src/payment/order/entities/sub-order.entity";

export class Delivery{
    delivery_id: number;
    status: DeliveryStatus;
    cod_amount: number;
    discount_amount: number;
    shipping_amount: number;
    final_amount: number;
    ship_date: Date;
    created: Date;
    updated: Date;
    sub_order?: SubOrder;
    tracking_number: string;
    delivery_instructions: string;
    delivery_method: string; // Hàng nhẹ/ hàng nặng
}