import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { PaginationOrder } from 'src/common/enums/pagination.enums';

export class SimpleCursorPagination {
    @IsOptional()
    @IsEnum(PaginationOrder)
    order? = 'DESC';

    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    limit? = 10;

    @IsOptional()
    @IsString()
    cursor?: string;
}
