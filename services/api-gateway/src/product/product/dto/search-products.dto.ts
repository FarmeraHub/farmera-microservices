import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';
import { ProductStatus } from 'src/common/enums/product/product-status.enum';

export class SearchProductsDto extends PaginationOptions {
    @ApiPropertyOptional({
        description: 'Search term for product name or description',
        example: 'tomato',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Minimum price filter',
        example: 10000,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    min_price?: number;

    @ApiPropertyOptional({
        description: 'Maximum price filter',
        example: 50000,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    max_price?: number;

    @ApiPropertyOptional({
        description: 'Minimum rating filter (from 1 to 5)',
        example: 3,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    min_rating?: number;

    @ApiPropertyOptional({
        description: 'Maximum rating filter (from 1 to 5)',
        example: 5,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    max_rating?: number;

    @ApiPropertyOptional({
        description: 'Minimum total sold products',
        example: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    min_total_sold?: number;

    @ApiPropertyOptional({
        description: 'Product status filter',
        enum: ProductStatus,
        example: ProductStatus.OPEN_FOR_SALE,
    })
    @IsOptional()
    @IsEnum(ProductStatus)
    status?: ProductStatus;

    @ApiPropertyOptional({
        description: 'CategoryID or Subcategory ID to filter by',
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    subcategory_id?: number;

    @ApiPropertyOptional({
        description: 'Indicates whether the ID is a category ID (true) or subcategory ID (false)',
        example: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    is_category?: boolean;

    @ApiPropertyOptional({
        description: 'Whether to include farm information in the result',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_farm?: boolean;

    @ApiPropertyOptional({
        description: 'Whether to include categories in the result',
        example: false,
    })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_categories?: boolean;

}
