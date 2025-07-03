import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { NewConversation } from './dto/new-conversation.dto';
import { CommunicationServiceClient, CreateConversationRequest, CreateConversationResponse, CreatePrivateConversationRequest, CreatePrivateConversationResponse, DeleteMessageRequest, DeleteMessageResponse, GetConversationMessagesRequest, GetConversationMessagesResponse, GetConversationParticipantsRequest, GetConversationParticipantsResponse, ListConversationsRequest, ListConversationsResponse } from '@farmera/grpc-proto/dist/communication/communication';
import { firstValueFrom } from 'rxjs';
import { ConversationMapper } from 'src/mappers/communication/conversation.mapper';
import { Conversation } from './entities/conversation.entity';
import { ConversationListDto } from './dto/conversation-list.dto';
import { UserListDto } from './dto/user-list.dto';
import { ConversationMessage, GetMessagesDto } from './dto/message.dto';
import { ErrorMapper } from 'src/mappers/common/error.mapper';

@Injectable()
export class ConversationService implements OnModuleInit {

    private logger = new Logger(ConversationService.name);
    private communicationGrpcService: CommunicationServiceClient;

    constructor(
        @Inject("COMMUNICATION_PACKAGE") private client: ClientGrpc
    ) { }

    onModuleInit() {
        // Initialize the gRPC service client
        this.communicationGrpcService = this.client.getService<CommunicationServiceClient>('CommunicationService');
    }

    async createConversation(newConversation: NewConversation): Promise<CreateConversationResponse> {
        try {
            const request: CreateConversationRequest = { title: newConversation.title };
            // Convert Observable to Promise for simpler handling
            return firstValueFrom(this.communicationGrpcService.createConversation(request));
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async listConversations(request: ListConversationsRequest): Promise<ConversationListDto[]> {
        try {
            const result = await firstValueFrom(this.communicationGrpcService.listConversations(request));
            return ConversationMapper.fromGrpcListConversationsResponse(result);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async getConversationParticipants(
        request: GetConversationParticipantsRequest,
    ): Promise<UserListDto[]> {
        try {
            const result = await firstValueFrom(this.communicationGrpcService.getConversationParticipants(request));
            return ConversationMapper.fromGrpcGetConversationParticipantsResponse(result);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async getConversationMessages(query: GetMessagesDto): Promise<ConversationMessage[]> {
        try {
            const request = ConversationMapper.toGrpcGetConversationMessagesRequest(query);
            const result = await firstValueFrom(this.communicationGrpcService.getConversationMessages(request));
            return ConversationMapper.fromGrpcGetConversationMessagesResponse(result);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async deleteMessage(request: DeleteMessageRequest): Promise<boolean> {
        try {
            let result = await firstValueFrom(this.communicationGrpcService.deleteMessage(request));
            return result.success;
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async createPrivateConversation(request: CreatePrivateConversationRequest): Promise<Conversation> {
        try {
            const result = await firstValueFrom(this.communicationGrpcService.createPrivateConversation(request));
            return ConversationMapper.fromGrpcCreatePrivateConversationResponse(result);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async getUnreadCount(userId: string): Promise<number> {
        try {
            const result = await firstValueFrom(this.communicationGrpcService.getUnreadCount({
                user_id: userId,
            }));
            return result.count;
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async markAsRead(conversationId: number, userId: string): Promise<boolean> {
        try {
            const result = await firstValueFrom(this.communicationGrpcService.markAsRead({
                conversation_id: conversationId,
                user_id: userId,
            }));
            return result.success;
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }
}
