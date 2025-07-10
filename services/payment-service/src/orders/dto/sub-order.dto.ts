import { SubOrderStatus } from "src/common/enums/payment/sub-order-status.enum";

export class SubOrderDto {
    sub_order_id: number;
    farm_id: string;
    status: SubOrderStatus;
    total_amount: number;
    discount_amount: number;
    shipping_amount: number;
    final_amount: number;
    currency: string;
    avatar_url: string;
    notes: string;
}