import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Order } from 'src/pagination/dto/pagination-options.dto';

export class GetReviewsDto {
    @ApiPropertyOptional({ description: 'Sort by field', enum: ['created', 'rating'], example: 'created' })
    @IsOptional()
    @IsString()
    sort_by?: string;

    @ApiPropertyOptional({ description: 'Order direction', enum: ['ASC', 'DESC'], example: 'DESC' })
    @IsOptional()
    @IsEnum(Order)
    order? = Order.DESC

    @ApiPropertyOptional({ description: 'Limit of reviews to return', example: 10 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit? = 10;

    @ApiPropertyOptional({ description: 'Cursor for pagination', example: 'abcdef' })
    @IsOptional()
    @IsString()
    cursor?: string;

    @ApiPropertyOptional({ description: 'Rating filter', example: 5 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    rating_filter?: number;
}
