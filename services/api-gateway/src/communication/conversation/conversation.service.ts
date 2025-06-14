import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { NewConversation } from './dto/new-conversation.dto';
import { CommunicationServiceClient, CreateConversationRequest, CreateConversationResponse, CreatePrivateConversationRequest, CreatePrivateConversationResponse, DeleteMessageRequest, DeleteMessageResponse, GetConversationMessagesRequest, GetConversationMessagesResponse, GetConversationParticipantsRequest, GetConversationParticipantsResponse, ListConversationsRequest, ListConversationsResponse } from '@farmera/grpc-proto/dist/communication/communication';
import { firstValueFrom } from 'rxjs';
import { ConversationMapper } from 'src/mappers/communication/conversation.mapper';
import { Conversation } from './entities/conversation.entity';
import { ConversationListDto } from './dto/conversation-list.dto';
import { UserListDto } from './dto/user-list.dto';
import { ConversationMessage, GetMessagesDto } from './dto/message.dto';

@Injectable()
export class ConversationService implements OnModuleInit {

    private communicationGrpcService: CommunicationServiceClient;

    constructor(
        @Inject("COMMUNICATION_PACKAGE") private client: ClientGrpc
    ) { }

    onModuleInit() {
        // Initialize the gRPC service client
        this.communicationGrpcService = this.client.getService<CommunicationServiceClient>('CommunicationService');
    }

    async createConversation(newConversation: NewConversation): Promise<CreateConversationResponse> {
        const request: CreateConversationRequest = { title: newConversation.title };
        // Convert Observable to Promise for simpler handling
        return firstValueFrom(this.communicationGrpcService.createConversation(request));
    }

    async listConversations(request: ListConversationsRequest): Promise<ConversationListDto[]> {
        const result = await firstValueFrom(this.communicationGrpcService.listConversations(request));
        return ConversationMapper.fromGrpcListConversationsResponse(result);
    }

    async getConversationParticipants(
        request: GetConversationParticipantsRequest,
    ): Promise<UserListDto[]> {
        const result = await firstValueFrom(this.communicationGrpcService.getConversationParticipants(request));
        return ConversationMapper.fromGrpcGetConversationParticipantsResponse(result);
    }

    async getConversationMessages(query: GetMessagesDto): Promise<ConversationMessage[]> {
        const request = ConversationMapper.toGrpcGetConversationMessagesRequest(query);
        const result = await firstValueFrom(this.communicationGrpcService.getConversationMessages(request));
        return ConversationMapper.fromGrpcGetConversationMessagesResponse(result);
    }

    async deleteMessage(request: DeleteMessageRequest): Promise<boolean> {
        let result = await firstValueFrom(this.communicationGrpcService.deleteMessage(request));
        return result.success;
    }

    async createPrivateConversation(request: CreatePrivateConversationRequest): Promise<Conversation> {
        const result = await firstValueFrom(this.communicationGrpcService.createPrivateConversation(request));
        return ConversationMapper.fromGrpcCreatePrivateConversationResponse(result);
    }
}
