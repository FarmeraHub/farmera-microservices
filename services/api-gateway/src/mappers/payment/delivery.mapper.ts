import { Delivery as GrpcDelivery} from "@farmera/grpc-proto/dist/payment/payment";
import { Delivery } from "src/payment/delivery/entities/delivery.entity";
import { EnumMapper } from "../common/enum.mapper";
import { TypesMapper } from "../common/types.mapper";
export class DeliveryMapper {
    static fromGrpcDelivery(value: GrpcDelivery): Delivery | undefined {
        if (!value) return undefined;

        const delivery: Delivery = {
            delivery_id: value.delivery_id,
            status: EnumMapper.fromGrpcDeliveryStatus(value.status),
            tracking_number: value.tracking_number,
            delivery_instructions: value.delivery_instructions,
            shipping_amount: value.shipping_amount,
            discount_amount: value.discount_amount,
            final_amount: value.final_amount,
            cod_amount: value.cod_amount,
            ship_date: value.ship_date ? TypesMapper.fromGrpcTimestamp(value.ship_date) : null,
            delivery_method: value.delivery_method,
            created: TypesMapper.fromGrpcTimestamp(value.created_at),
            updated: TypesMapper.fromGrpcTimestamp(value.updated_at),
        };
        return delivery;

    }
}