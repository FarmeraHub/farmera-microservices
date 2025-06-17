import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from './create-product.dto';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';

export class SearchProductsDto extends PaginationOptions {
    @ApiPropertyOptional({
        description: 'Search term for product name or description',
        example: 'tomato',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Category ID to filter by',
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    category?: number;

    @ApiPropertyOptional({
        description: 'Subcategory ID to filter by',
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    subcategory?: number;

    @ApiPropertyOptional({
        description: 'Minimum price filter',
        example: 10000,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minPrice?: number;

    @ApiPropertyOptional({
        description: 'Maximum price filter',
        example: 50000,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxPrice?: number;

    @ApiPropertyOptional({
        description: 'Farm ID to filter by',
        example: 'uuid-farm-id',
    })
    @IsOptional()
    @IsString()
    farmId?: string;

    @ApiPropertyOptional({
        description: 'Product status filter',
        enum: ProductStatus,
        example: ProductStatus.OPEN_FOR_SALE,
    })
    @IsOptional()
    @IsEnum(ProductStatus)
    status?: ProductStatus;
}
