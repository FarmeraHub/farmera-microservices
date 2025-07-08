import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { Attachment, Email } from "../dtos/email.dto";
import { NotificationChannel } from "../enums/channel";
import { NotificationType } from "../enums/notification_type";
import { Type } from "class-transformer";

export class SendNotification {
    @IsOptional()
    @IsString()
    recipient?: string;

    @IsEnum(NotificationType)
    notification_type: NotificationType;

    @IsArray()
    @ArrayNotEmpty()
    @IsEnum(NotificationChannel, { each: true })
    channels: NotificationChannel[];

    @ValidateNested()
    @Type(() => Email)
    from: Email;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsString()
    content_type: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({})
    template_id?: number;

    @IsOptional()
    @IsObject()
    template_props?: { [key: string]: string };

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Attachment)
    attachments?: Attachment[];

    @IsOptional()
    @ValidateNested()
    @Type(() => Email)
    reply_to: Email;
}