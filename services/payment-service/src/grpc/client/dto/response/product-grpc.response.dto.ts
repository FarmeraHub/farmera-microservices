
export interface ProductDtoGrpcResponse {
    product_id: number;
    product_name: string;
    description: string;
    price_per_unit: number;
    unit: string;
    stock_quantity: number;
    weight: number;
    image_urls: string[];
    video_urls: string[];
    status: number;
    farm_id: string;
    farm: FarmDtoGrpcResponse;

}

export interface FarmDtoGrpcResponse {
    farm_id: string;
    farm_name: string;
    farm_description: string;
    farm_location: string;
    phone?: string;
    email?: string;
    tax_number?: string;
    status?: number;
    user_id: string;
    address: AddressDtoGrpcResponse;
}
export interface AddressGhnDtoGrpcResponse {
    id: number;
    province_id: number;
    district_id: number;
    ward_code: string;
}

export interface AddressDtoGrpcResponse {
    address_id: string;
    city: string;
    district: string;
    ward: string;
    street: string;
    coordinate: string;
    farm_id: string;
    address_ghn: AddressGhnDtoGrpcResponse;

}
export interface ListProductsDtoGrpcResponse {
    products: ProductDtoGrpcResponse[];
}