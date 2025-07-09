import { ShippingDetail } from "src/payment/order/entities/shipping-detail.entity";
import { ShippingFeeDetails } from "@farmera/grpc-proto/dist/payment/payment";
import { Item } from "src/payment/order/entities/Item.entity";
import { ItemMapper } from "./item.mapper";
export class ShippingDetailMapper{
    static fromGrpcShippingDetail(value: ShippingFeeDetails): ShippingDetail | undefined {
        if (!value) return undefined;
        const shippingDetail: ShippingDetail = {
            farm_id: value.farm_id,
            farm_name: value.farm_name,
            final_fee: value.final_fee,
            shipping_fee: value.shipping_fee,
            currency: value.currency,
        };
        if (value.products)
        {
            shippingDetail.products = value.products.map(product => ItemMapper.fromGrpcItem(product)).filter(item => item !== undefined);
        }
        return shippingDetail;
    }
}