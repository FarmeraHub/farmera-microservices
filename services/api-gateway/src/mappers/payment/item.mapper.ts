import { Item } from "src/payment/order/entities/Item.entity";
import { ItemResponse } from "@farmera/grpc-proto/dist/payment/payment";
export class ItemMapper{
    static fromGrpcItem(value: ItemResponse): Item | undefined {
        if (!value) return undefined;
        return {
            product_id: value.product_id,
            product_name: value.product_name,
            quantity: value.quantity,
            price_per_unit: value.price_per_unit,
            total_price: value.total_price,
            unit: value.unit,
            weight: value.weight,
            image_url: value.image_url,
            requested_quantity: value.requested_quantity,
        };
    }
}