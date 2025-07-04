import {
    ItemResponse as GrpcItemResponse,
    ShippingFeeDetails as GrpcShippingFeeDetails,
    Issue as GrpcIssue,
    Delivery as GrpcDelivery,
} from "@farmera/grpc-proto/dist/payment/payment";
import { Issue, Item, ShippingFeeDetails } from "src/delivery/enitites/cart.entity";
import { Delivery } from "src/delivery/enitites/delivery.entity";
import { SubOrderMapper } from "./suborder.mapper";
import { TypesMapper } from "../common/types.mapper";

export class DeliveryEnumMapper {
    static toGrpcItem(values: Item): GrpcItemResponse {
        return {
            product_id: values.product_id,
            product_name: values.product_name,
            quantity: values.quantity,
            unit: values.unit ,
            price_per_unit: values.price_per_unit,
            total_price: values.total_price,
            weight: values.weight,
            image_url: values.image_url || "",
        };
    }

    static toGrpcShippingFeeDetails(values: ShippingFeeDetails): GrpcShippingFeeDetails {
        return {
            farm_id: values.farm_id,
            farm_name: values.farm_name,
            shipping_fee: values.shipping_fee,
            avatar_url: values.avatar_url,
            final_fee: values.total,
            currency: values.currency,
            products: values.products.map((item) => this.toGrpcItem(item)),
        };
    }
    static toGrpcDelivery(value: Delivery): GrpcDelivery{
        return {
            delivery_id: value.delivery_id,
            tracking_number: value.tracking_number,
            delivery_instructions: value.delivery_instructions,
            shipping_amount: value.shipping_amount,
            discount_amount: value.discount_amount,
            cod_amount: value.cod_amount,
            final_amount: value.final_amount,
            ship_date: TypesMapper.toGrpcTimestamp(value.ship_date),
            created_at: TypesMapper.toGrpcTimestamp(value.created),
            updated_at: TypesMapper.toGrpcTimestamp(value.updated),
            delivery_method: value.delivery_method,
        } 
    }

        
}