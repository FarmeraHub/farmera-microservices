import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { ProductStatus } from "src/common/enums/product-status.enum";

export class CreateProductDto {

  @IsNotEmpty()
  @IsString()
  product_name: string;

  @IsOptional()
  @IsString()
  description?: string;

  // @IsNotEmpty()
  // @IsString()
  // farm: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price_per_unit: number;

  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  stock_quantity: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  weight: number;

  @IsEnum(ProductStatus)
  status: ProductStatus;

  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  subcategory_ids?: number[];
}