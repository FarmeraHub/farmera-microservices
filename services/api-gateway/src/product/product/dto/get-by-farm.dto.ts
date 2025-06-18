import { Type } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";
import { PaginationOptions } from "src/pagination/dto/pagination-options.dto";

export class GetProductByFarmDto extends PaginationOptions {
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_categories?: boolean;
}