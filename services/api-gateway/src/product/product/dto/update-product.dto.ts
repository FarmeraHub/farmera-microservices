import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {

    @ApiProperty({ description: 'Product ID', example: 1 })
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    product_id: number;

    @ApiProperty({ description: 'Product name', example: 'Tomato' })
    @IsString()
    product_name: string;

    @ApiProperty({ description: 'Product description', example: 'Fresh organic tomatoes' })
    @IsString()
    description: string;

    @ApiProperty({ description: 'Price per unit', example: 10000 })
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    price_per_unit: number;

    @ApiProperty({ description: 'Unit of measurement', example: 'kg' })
    @IsString()
    unit: string;

    @ApiProperty({ description: 'Stock quantity', example: 100 })
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    stock_quantity: number;

    @ApiProperty({ description: 'Weight per unit', example: 1 })
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    weight: number;

    @ApiPropertyOptional({ description: 'Image URLs', example: ['https://example.com/img1.jpg'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    image_urls?: string[];

    @ApiPropertyOptional({ description: 'Video URLs', example: ['https://example.com/video1.mp4'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    video_urls?: string[];
}