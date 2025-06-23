import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateSubcategoryDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description: string;

    @Transform(({ value }) => parseInt(value))
    @IsInt({ message: 'category_id must be an integer number' })
    category_id: number;
}
