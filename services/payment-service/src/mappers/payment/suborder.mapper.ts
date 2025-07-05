import { SubOrder } from "src/orders/entities/sub-order.entity";
import { SubOrder as GrpcSubOrder } from "@farmera/grpc-proto/dist/payment/payment";
import { TypesMapper } from "../common/types.mapper";
import { EnumMapper } from "../common/enum.mapper";
import { OrderMapper } from "./order.mapper";
import { DeliveryMapper } from "./delivery.mapper";
import { OrderDetailMapper } from "./order-detail.mapper";

export class SubOrderMapper {
    static toGrpcSubOrder(value: SubOrder): GrpcSubOrder {
        return {
            sub_order_id: value.sub_order_id,
            farm_id: value.farm_id,
            total_amount: value.total_amount,
            discount_amount: value.discount_amount,
            shipping_amount: value.shipping_amount,
            final_amount: value.final_amount,
            created: TypesMapper.toGrpcTimestamp(value.created),
            currency: value.currency,
            status: EnumMapper.toGrpcSubOrderStatus(value.status),
            delivery: value.delivery ? DeliveryMapper.toGrpcDelivery(value.delivery) : undefined,
        };
    }
    
}