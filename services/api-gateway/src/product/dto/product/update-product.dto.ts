import {
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from './create-product.dto';

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Organic Tomatoes',
  })
  @IsOptional()
  @IsString()
  product_name?: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Fresh organic tomatoes grown without pesticides',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Price per unit',
    example: 25000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price_per_unit?: number;

  @ApiPropertyOptional({
    description: 'Unit of measurement',
    example: 'kg',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    description: 'Stock quantity',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  stock_quantity?: number;

  @ApiPropertyOptional({
    description: 'Weight in grams',
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  weight?: number;

  @ApiPropertyOptional({
    description: 'Product status',
    enum: ProductStatus,
    example: ProductStatus.OPEN_FOR_SALE,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Array of subcategory IDs',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @ArrayNotEmpty()
  subcategory_ids?: number[];

  @ApiPropertyOptional({
    description: 'Image URLs to keep',
    example: ['https://example.com/image1.jpg'],
    type: [String],
  })
  @IsOptional()
  image_urls?: string[];

  @ApiPropertyOptional({
    description: 'Video URLs to keep',
    example: ['https://example.com/video1.mp4'],
    type: [String],
  })
  @IsOptional()
  video_urls?: string[];
}
