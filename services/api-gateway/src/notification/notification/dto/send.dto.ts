import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { NotificationType } from "src/common/enums/notification/notification_type";
import { NotificationChannel } from "src/common/enums/notification/notification-channel.enum";
import { Attachment, Email } from "./email.dto";

export class SendNotificationDto {
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

    @ValidateNested()
    @Type(() => Email)
    reply_to: Email;
}