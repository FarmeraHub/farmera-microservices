import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { PushMessageType } from "../enums/push";
import { Type } from "class-transformer";

export class SendPushNotificationDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    recipient: string[];

    @IsEnum(PushMessageType)
    type: PushMessageType;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    template_id?: number;

    @IsOptional()
    @IsObject()
    template_props?: { [key: string]: string };

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    content?: string;
}