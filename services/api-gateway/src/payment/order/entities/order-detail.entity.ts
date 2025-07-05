import { SubOrder } from "./sub-order.entity";

export class OrderDetail{
    order_detail_id: number;
    product_id: number;
    product_name: string;
    request_quantity: number;
    price_per_unit: number;
    unit: string;
    sub_order?: SubOrder;
    weight: number;
    image_url?: string;
    total_price: number;
}