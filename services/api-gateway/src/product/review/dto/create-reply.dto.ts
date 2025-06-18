import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateReplyDto {
    @ApiProperty({ description: 'Review ID to reply to', example: 1 })
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    review_id: number;

    @ApiProperty({ description: 'Reply content', example: 'Thank you for your feedback!' })
    @IsString()
    @IsNotEmpty()
    reply: string;
}