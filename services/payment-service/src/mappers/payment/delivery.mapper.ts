import {
    ItemResponse as GrpcItemResponse,
    ShippingFeeDetails as GrpcShippingFeeDetails,
    Issue as GrpcIssue,
} from "@farmera/grpc-proto/dist/payment/payment";
import { Issue, Item, ShippingFeeDetails } from "src/delivery/enitites/cart.entity";

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
            final_fee: values.final_fee,
            currency: values.currency,
            products: values.products.map((item) => this.toGrpcItem(item)),
        };
    }

    static toGrpcIssue(issue: Issue): GrpcIssue {
        return {
            reason: issue.reason,
            details: issue.details,
            product_id: issue.product_id,
            farm_id: issue.farm_id,
            user_id: issue.user_id,
            address_id: issue.address_id,
        };
    }

        
}