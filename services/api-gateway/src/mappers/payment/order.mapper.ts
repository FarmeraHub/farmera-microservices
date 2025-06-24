import { OrderItemRequest } from "@farmera/grpc-proto/dist/payment/payment";

export class OrderMapper{
    static toGrpcOrderItemRequest(value: any): OrderItemRequest{
        if (!value) return undefined;

        return {
            product_id: value.product_id,
            quantity: value.quantity,
            special_instructions: value.special_instructions,
        };
    }
    
}