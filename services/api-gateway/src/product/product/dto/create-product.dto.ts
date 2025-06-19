import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {

  @ApiProperty({ description: 'Product name', example: 'Tomato' })
  @IsNotEmpty()
  @IsString()
  product_name: string;

  @ApiPropertyOptional({ description: 'Product description', example: 'Fresh organic tomatoes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price per unit', example: 10000 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price_per_unit: number;

  @ApiProperty({ description: 'Unit of measurement', example: 'kg' })
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Stock quantity', example: 100 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  stock_quantity: number;

  @ApiProperty({ description: 'Weight per unit', example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  weight: number;

  @ApiPropertyOptional({ description: 'Subcategory IDs', example: [1, 2] })
  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  subcategory_ids?: number[];

  @ApiPropertyOptional({ description: 'Image URLs', example: ['https://example.com/img1.jpg'] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  image_urls?: string[];

  @ApiPropertyOptional({ description: 'Video URLs', example: ['https://example.com/video1.mp4'] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  video_urls?: string[];
}