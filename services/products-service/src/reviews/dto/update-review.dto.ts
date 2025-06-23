import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID, Max, Min } from "class-validator";

export class UpdateReviewDto {
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    @IsNotEmpty()
    comment: string;

    @IsArray()
    @IsString({ each: true })
    image_urls?: string[];

    @IsArray()
    @IsString({ each: true })
    video_urls?: string[];
}