import { SubOrderStatus } from "src/common/enums/payment/sub-order-status.enum";
import { Order } from "./order.entity";
import { Delivery } from "src/payment/delivery/entities/delivery.entity";

export class SubOrder{
    sub_order_id: number;
    order?: Order;
    farm_id: string;
    status: SubOrderStatus;
    total_amount: number;
    discount_amount: number;
    shipping_amount: number;
    final_amount: number;
    created: Date;
    avatar_url?: string;
    notes?: string;
    currency: string;
    delivery?: Delivery;

}