import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationOrder } from 'src/enums/pagination.enums';

export class SimpleCursorPagination {
    @IsOptional()
    @IsEnum(PaginationOrder)
    order? = PaginationOrder.DESC

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit? = 10;

    @IsOptional()
    @IsString()
    cursor?: string;
}
