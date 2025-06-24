import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class Email {
    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    name?: string;
}

export class Attachment {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsNotEmpty()
    filename: string;

    @IsString()
    @IsNotEmpty()
    mime_type: string;

    @IsString()
    disposition: string = "attachment";
}