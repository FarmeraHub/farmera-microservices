import { OrderItem  as GrpcOrderDetail } from "@farmera/grpc-proto/dist/payment/payment";
import { OrderDetail } from "src/orders/entities/order-detail.entity";
import { EnumMapper } from "../common/enum.mapper";
import { SubOrderMapper } from "./suborder.mapper";


export class OrderDetailMapper {
    static toGrpcOrderItem(value: OrderDetail): GrpcOrderDetail{
        return {
            item_id: value.order_detail_id,
            product_id: value.product_id,
            product_name: value.product_name,
            request_quantity: value.request_quantity,
            price_per_unit: value.price_per_unit,
            unit: value.unit,
            weight: value.weight,
            image_url: value.image_url,
            total_price: value.total_price,
        };
    }
}