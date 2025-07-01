import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, ValidateNested } from "class-validator";

export class ItemDeliveryRequestDto {
    @ApiProperty({
        description: 'Product ID',
        example: 2,
    })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    product_id: number;

    @ApiProperty({
        description: 'Quantity of the item to be delivered',
        example: 2,
    })
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    quantity: number;
}

export class SubOrderRequestDto {
    @ApiProperty({
        description: 'Farm ID',
        example: 'farm123',
    })
    @IsNotEmpty()
    @IsString()
    farm_id: string;

    @ApiProperty({
        description: 'List of items to be delivered',
        type: [ItemDeliveryRequestDto],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItemDeliveryRequestDto)
    products: ItemDeliveryRequestDto[];

}
export class OrderInfoRequestDto {

    @ApiProperty({
        description: 'Address ID for delivery',
        example: '1',
    })
    @IsNotEmpty()
    @IsString()
    address_id: string;

    @ApiProperty({
        description: 'Payment method type',
        example: 'credit_card',
    })
    @IsOptional()
    @IsString()
    payment_type?: string;
}

export class CalculateDeliveryRequestDto {
    @ApiProperty({
        description: 'Suborder containing items to be delivered',
        type: SubOrderRequestDto,
    })
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => SubOrderRequestDto)
    suborders: SubOrderRequestDto;

    @ApiProperty({
        description: 'Order information including user ID and address ID',
        type: OrderInfoRequestDto,
    })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => OrderInfoRequestDto)
    order_info: OrderInfoRequestDto;
}