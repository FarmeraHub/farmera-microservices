import { IsDate, IsNumber, IsPositive, IsUUID } from "class-validator";
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