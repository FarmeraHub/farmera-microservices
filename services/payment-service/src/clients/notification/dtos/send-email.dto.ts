import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { Attachment, Email } from "../entities/email.entity";
import { Type } from "class-transformer";

export class SendEmailNotificationDto {
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => Email)
    to: Email[];

    @ValidateNested()
    @Type(() => Email)
    from: Email;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({})
    template_id?: number;

    @IsOptional()
    @IsObject()
    template_props?: { [key: string]: string };

    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsString()
    content_type: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Attachment)
    attachments?: Attachment[];

    @IsOptional()
    @ValidateNested()
    @Type(() => Email)
    reply_to?: Email;
}