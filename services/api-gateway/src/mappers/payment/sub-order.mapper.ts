import { SubOrder as GrpcSubOrder } from "@farmera/grpc-proto/dist/payment/payment";
import { SubOrder } from "src/payment/order/entities/sub-order.entity";
import { EnumMapper } from "../common/enum.mapper";
import { TypesMapper } from "../common/types.mapper";
import { DeliveryMapper } from "./delivery.mapper";
import { OrderMapper } from "./order.mapper";
export class SubOrderMapper {
    static fromGrpcSubOrder(value: GrpcSubOrder): SubOrder | undefined {
        if (!value) return undefined;

        let subOrder: SubOrder = {
            sub_order_id: value.sub_order_id,
            farm_id: value.farm_id,
            status: EnumMapper.fromGrpcSubOrderStatus(value.status),
            total_amount: value.total_amount,
            shipping_amount: value.shipping_amount,
            final_amount: value.final_amount,
            discount_amount: value.discount_amount,
            created: TypesMapper.fromGrpcTimestamp(value.created),
            currency: value.currency,
        }
        if (value.avatar_url) {
            subOrder.avatar_url = value.avatar_url;
        }
        if (value.notes) {
            subOrder.notes = value.notes;
        }
        if (value.delivery) {
            subOrder.delivery = DeliveryMapper.fromGrpcDelivery(value.delivery);
        }
        if (value.order) {
            subOrder.order = OrderMapper.fromGrpcOrder(value.order);
        }
        return subOrder;
    }
}