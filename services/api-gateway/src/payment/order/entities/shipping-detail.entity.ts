import { Item } from "./Item.entity";

export class ShippingDetail{
    farm_id: string;
    farm_name: string;
    final_fee: number;
    shipping_fee: number;
    currency: string;
    products?: Item[];

}