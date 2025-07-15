import { ConversationMessage } from "./message.dto";

export class ConversationListDto {
    id: number;
    conversation_id: number;
    title: string;
    created_at: Date;
    latest_message: ConversationMessage | undefined;
    participants: string[];
}