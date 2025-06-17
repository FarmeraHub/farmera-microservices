import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { PaginationOptions } from "src/pagination/dto/pagination-options.dto";

export class SearchCategoryDto extends PaginationOptions {
    @ApiProperty({
        description: 'Keyword used to search for categories',
        example: 'fruits',
    })
    @IsString({ message: "Từ khóa không hợp lệ" })
    @IsNotEmpty({ message: "Từ khóa rỗng" })
    query: string;
}