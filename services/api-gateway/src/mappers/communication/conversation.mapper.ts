import { CreatePrivateConversationResponse, GetConversationMessagesRequest, GetConversationMessagesResponse, GetConversationParticipantsResponse, ListConversationsResponse } from "@farmera/grpc-proto/dist/communication/communication";
import { Conversation } from "src/communication/conversation/entities/conversation.entity";
import { TypesMapper } from "../common/types.mapper";
import { ConversationListDto } from "src/communication/conversation/dto/conversation-list.dto";
import { EnumMapper } from "../common/enum.mapper";
import { UserListDto } from "src/communication/conversation/dto/user-list.dto";
import { ConversationMessage, GetMessagesDto } from "src/communication/conversation/dto/message.dto";

export class ConversationMapper {
    static fromGrpcCreatePrivateConversationResponse(value: CreatePrivateConversationResponse): Conversation {
        return {
            conversation_id: value.conversation_id,
            title: value.title,
            latest_message: value.latest_message,
            created_at: TypesMapper.fromGrpcTimestamp(value.created_at),
        }
    }

    static fromGrpcListConversationsResponse(value: ListConversationsResponse): ConversationListDto[] {
        return value.conversations.map((value): ConversationListDto => ({
            id: value.id,
            conversation_id: value.conversation_id,
            title: value.title,
            latest_message: value.message_id ? {
                message_id: value.message_id,
                conversation_id: value.conversation_id,
                sender_id: value.sender_id,
                content: value.content,
                sent_at: TypesMapper.fromGrpcTimestamp(value.sent_at),
                is_read: value.is_read,
                type: EnumMapper.fromGrpcMessageType(value.type)
            } : undefined,
            participants: value.participants,
        }))
    }

    static fromGrpcGetConversationParticipantsResponse(value: GetConversationParticipantsResponse): UserListDto[] {
        return value.participants.map((value): UserListDto => ({
            id: value.id,
            conversation_id: value.conversation_id,
            user_id: value.user_id,
            deleted_at: TypesMapper.fromGrpcTimestamp(value.deleted_at),
        }));
    }

    static fromGrpcGetConversationMessagesResponse(value: GetConversationMessagesResponse): ConversationMessage[] {
        return value.messages.map((value): ConversationMessage => ({
            message_id: value.message_id,
            conversation_id: value.conversation_id,
            sender_id: value.sender_id,
            content: value.content,
            is_read: value.is_read,
            sent_at: TypesMapper.fromGrpcTimestamp(value.sent_at),
            type: EnumMapper.fromGrpcMessageType(value.type),
        }));
    }

    static toGrpcGetConversationMessagesRequest(value: GetMessagesDto): GetConversationMessagesRequest {
        return {
            user_id: value.user_id,
            conversation_id: value.conversation_id,
            before: TypesMapper.toGrpcTimestamp(value.before),
            limit: value.limit
        }
    }
}