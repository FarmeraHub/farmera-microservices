import { DeliveryStatus } from "src/common/enums/payment/delivery.enum";

export class CreateDeliveryDto {
    status: DeliveryStatus;
    total_cost: number;
    discount_amount?: number;
    shipping_amount: number;
    final_amount: number;
}