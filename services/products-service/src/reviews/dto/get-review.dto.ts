import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetReviewsDto {
    @IsNumber()
    @Type(() => Number)
    productId: number;

    @IsOptional()
    @IsEnum(['created', 'rating'])
    sortBy: 'created' | 'rating' = 'created';

    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    order: 'ASC' | 'DESC' = 'DESC';

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit = 10;

    @IsOptional()
    @IsString()
    cursor: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page: number;
}
