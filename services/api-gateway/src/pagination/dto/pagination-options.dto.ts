import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class SortOption {
  @IsString()
  @IsNotEmpty()
  field: string;

  @IsEnum(Order)
  direction: Order = Order.ASC;
}


export class SimpleCursorPagination {
  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @IsEnum(Order)
  order? = Order.DESC

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit? = 10;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cursor?: string;
}

export class PaginationOptions {
  // Sort
  @ApiPropertyOptional({ enum: Order, default: Order.ASC })
  @IsEnum(Order)
  @IsOptional()
  readonly order?: Order = Order.ASC;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly sort_by?: string;

  // Pagination
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  readonly limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  readonly all?: boolean;

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 10);
  }
}
