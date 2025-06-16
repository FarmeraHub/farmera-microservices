import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductStatus {
  UNSPECIFIED = 'UNSPECIFIED',
  PRE_ORDER = 'PRE_ORDER',
  NOT_YET_OPEN = 'NOT_YET_OPEN',
  OPEN_FOR_SALE = 'OPEN_FOR_SALE',
  SOLD_OUT = 'SOLD_OUT',
  CLOSED = 'CLOSED',
  DELETED = 'DELETED',
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Organic Tomatoes',
  })
  @IsNotEmpty()
  @IsString()
  product_name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Fresh organic tomatoes grown without pesticides',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Price per unit',
    example: 25000,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price_per_unit: number;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'kg',
  })
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiProperty({
    description: 'Stock quantity',
    example: 100,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  stock_quantity: number;

  @ApiProperty({
    description: 'Weight in grams',
    example: 1000,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  weight: number;

  @ApiProperty({
    description: 'Product status',
    enum: ProductStatus,
    example: ProductStatus.PRE_ORDER,
  })
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @ApiPropertyOptional({
    description: 'Array of subcategory IDs',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  subcategory_ids?: number[];
}
