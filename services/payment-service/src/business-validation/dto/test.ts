import { IsInt, IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ItemRequestDto {
    @IsInt()
    product_id: number;

    @IsInt()
    quantity: number;
}

export class SuborderRequestDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItemRequestDto)
    products: ItemRequestDto[];

    @IsString()
    farm_id: string;
}

export class OrderInfoRequestDto {
    @IsString()
    user_id: string;

    @IsString()
    address_id: string;

    @IsString()
    @IsOptional()
    payment_method_id: string;
}

export class OrderRequestDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SuborderRequestDto)
    suborders: SuborderRequestDto[];

    @ValidateNested()
    @Type(() => OrderInfoRequestDto)
    order_info: OrderInfoRequestDto;
}
