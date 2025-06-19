import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { ProductStatus } from "src/common/enums/product-status.enum";

export class UpdateProductDto {

    @IsString()
    product_name: string;

    @IsString()
    description: string;

    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    price_per_unit: number;

    @IsString()
    unit: string;

    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    stock_quantity: number;

    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    weight: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    image_urls?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    video_urls?: string[];
}