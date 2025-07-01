import { IsDate, IsNumber, IsOptional, IsPositive, IsUUID } from "class-validator";
import { MessageType } from "src/communication/enums/message-type.enums";

export class ConversationMessage {
    message_id: number;
    conversation_id: number;
    sender_id: string;
    content?: string;
    sent_at: Date;
    type: MessageType;
    is_read: boolean;
}

export class GetMessagesDto {
    @IsUUID()
    user_id: string;

    @IsNumber()
    conversation_id: number;

    @IsDate()
    before?: Date;

    @IsNumber()
    @IsPositive()
    limit?: number;
}

export class ListMessagesDto {
    @IsNumber()
    @IsPositive()
    @IsOptional()
    limit?: number = 20;

    @IsDate()
    @IsOptional()
    before?: Date = new Date();
}