import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCategoriesDto {
    @IsString()
    @IsNotEmpty()
    name: string;
    @IsString()
    @IsOptional()
    description?: string;
    @IsString()
    image_url?: string;
}