import {
    Order as GrpcOrder,
    
  } from "@farmera/grpc-proto/dist/payment/payment";
import { Order } from "src/orders/entities/order.entity";
import { TypesMapper } from "../common/types.mapper";
import { EnumMapper } from "../common/enum.mapper";

export class OrderMapper{
    
    static toGrpcOrder(value: Order): GrpcOrder{
        return {
            order_id: value.order_id,
            customer_id: value.customer_id,
            address_id: value.address_id,
            total_amount: value.total_amount,
            shipping_amount: value.shipping_amount,
            final_amount: value.final_amount,
            status: EnumMapper.toGrpcOrderStatus(value.status),
            created: TypesMapper.toGrpcTimestamp(value.created),
            updated: TypesMapper.toGrpcTimestamp(value.updated),
            currency: value.currency,
        };
    }
}