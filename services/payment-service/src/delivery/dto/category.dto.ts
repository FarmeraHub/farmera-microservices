import { IsOptional } from "class-validator";

export class CategoryDto { 
    @IsOptional()
    level1?: string;

    @IsOptional()
    level2?: string;

    @IsOptional()
    level3?: string;
}