import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from "class-validator";

export class BaseOrderItemDto {
    @ApiProperty({
        description: 'The unique identifier of the product.',
        example: 101,
        type: Number,
    })
    @IsNumber({}, { message: 'Product ID must be a number.' })
    @IsInt({ message: 'Product ID must be an integer.' })
    @IsNotEmpty({ message: 'Product ID cannot be empty.' })
    product_id: number;

    @ApiProperty({
        description: 'The quantity of this product.',
        example: 2,
        minimum: 1,
        type: Number,
    })
    @IsNumber({}, { message: 'Quantity must be a number.' })
    @IsInt({ message: 'Quantity must be an integer.' })
    @Min(1, { message: 'Quantity must be at least 1.' })
    @IsNotEmpty({ message: 'Quantity cannot be empty.' })
    quantity: number;
}
export class BaseOrderDto {
    @ApiProperty({
        description: 'A list of products included in the order.',
        type: [BaseOrderItemDto],
        example: [
            { product_id: 101, quantity: 2 },
            { product_id: 102, quantity: 1 },
        ],
    })
    @IsArray({ message: 'Products must be an array.' })
    @ArrayNotEmpty({ message: 'Products list cannot be empty.' })
    @ArrayMinSize(1, { message: 'Order must contain at least one product.' })
    @ValidateNested({ each: true })
    @Type(() => BaseOrderItemDto)
    products: BaseOrderItemDto[];

    @ApiProperty({
        description: 'The unique identifier of the delivery address.',
        example: 'addr_123xyz789',
        type: String,
    })
    @IsString({ message: 'Address ID must be a string.' })
    @IsNotEmpty({ message: 'Address ID cannot be empty.' })
    address_id: string;
}