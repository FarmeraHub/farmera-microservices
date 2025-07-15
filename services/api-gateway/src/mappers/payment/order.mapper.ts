import { Order as GrpcOrder } from "@farmera/grpc-proto/dist/payment/payment";
import { Order } from "src/payment/order/entities/order.entity";
import { EnumMapper } from "../common/enum.mapper";
import { TypesMapper } from "../common/types.mapper";

export class OrderMapper{
    static fromGrpcOrder(value: GrpcOrder): Order | undefined {
        if (!value) return undefined;
        return {
            order_id: value.order_id,
            address_id: value.address_id,
            customer_id: value.customer_id,
            status: EnumMapper.fromGrpcOrderStatus(value.status) ,
            total_amount: value.total_amount,
            shipping_amount: value.shipping_amount,
            final_amount: value.final_amount,
            created: TypesMapper.fromGrpcTimestamp(value.created),
            updated: TypesMapper.fromGrpcTimestamp(value.updated),
            currency: value.currency,
        }
    }
    
}