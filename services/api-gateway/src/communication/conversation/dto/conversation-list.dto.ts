import { ConversationMessage } from "./message.dto";

export class ConversationListDto {
    id: number;
    conversation_id: number;
    title: string;
    latest_message: ConversationMessage | undefined
}