import { Type } from "class-transformer";
import { ArrayNotEmpty, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { ProductStatus } from "src/common/enums/product-status.enum";

export class UpdateProductDto {

    @IsOptional()
    @IsString()
    product_name: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    price_per_unit: number;

    @IsOptional()
    @IsString()
    unit: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    stock_quantity: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    weight: number;

    @IsOptional()
    @IsEnum(ProductStatus)
    status: ProductStatus;

    @IsOptional()
    @ArrayNotEmpty()
    subcategory_ids: number[];

    @IsOptional()
    image_urls: string[];

    @IsOptional()
    video_urls: string[];




}