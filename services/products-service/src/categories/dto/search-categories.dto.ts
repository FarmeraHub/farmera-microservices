import { IsString } from "class-validator";
import { PaginationOptions } from "src/pagination/dto/pagination-options.dto";

export class SearchCategoryDto extends PaginationOptions {
    @IsString()
    search: string;
}