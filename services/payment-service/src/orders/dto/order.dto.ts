export class ItemRequestDto {
    product_id: number;
    quantity: number;
}
export class SuborderRequestDto {
    products: ItemRequestDto[];
    farm_id: string;
}
export class OrderInfoRequestDto {
    user_id: string;
    address_id: string;
    payment_type?: string;
}
export class OrderRequestDto {
    suborders: SuborderRequestDto[];
    order_info: OrderInfoRequestDto;
}
export class CalculateShippingFeeRequestDto {
    suborder: SuborderRequestDto;
    order_info: OrderInfoRequestDto;
}
