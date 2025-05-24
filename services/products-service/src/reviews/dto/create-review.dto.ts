import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID, Max, Min } from "class-validator";

export class CreateReviewDto {
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    productId: number;

    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    @IsNotEmpty()
    comment: string;
}