import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID } from "class-validator";

export class CreateReplyDto {
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    reviewId: number;

    @IsString()
    @IsNotEmpty()
    reply: string;
}