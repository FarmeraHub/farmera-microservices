export class Item {
    product_id: number;
    product_name: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    total_price: number;
    weight: number; 
    image_url?: string;
}

export class ShippingFeeDetails {
    farm_id: string;
    farm_name: string;
    avatar_url: string;
    shipping_fee: number;
    final_fee: number;
    currency: string;
    city?: string;
    district?: string;   
    ward?: string;
    street?: string;
    street_number?: string;
    city_code?: number;
    district_code?: number;
    ward_code?: string;
    products: Item[];
}
export class Issue {
  reason: string;       
  details: string;    

  product_id?: number;
  farm_id?: string;
  user_id?: string;
  address_id?: string;
}
