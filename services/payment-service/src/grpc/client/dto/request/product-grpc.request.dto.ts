export interface ProductDtoGrpcRequest {
    product_id: number;
    product_name?: string;
    farm_id?: string;
}
export interface ListProductsDtoGrpcRequest {
    products: ProductDtoGrpcRequest[];
}
