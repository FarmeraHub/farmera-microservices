import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { NewConversation, NewPrivateConversation } from './dto/new-conversation.dto';
import { User } from 'src/common/decorators/user.decorator';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { Conversation } from './entities/conversation.entity';
import { ConversationListDto } from './dto/conversation-list.dto';
import { UserListDto } from './dto/user-list.dto';
import { ConversationMessage, GetMessagesDto } from './dto/message.dto';


@Controller('conversation')
export class ConversationController {

    constructor(private readonly conversationService: ConversationService) { }

    @Post()
    async createPrivateConversation(@User() user: UserInterface, @Body() newPrivateConversation: NewPrivateConversation): Promise<Conversation> {
        return await this.conversationService.createPrivateConversation({
            title: newPrivateConversation.title,
            user_a: user.id,
            user_b: newPrivateConversation.other_user_id
        });
    }

    @Get()
    async listUserConversation(@User() user: UserInterface, @Query("page") page?: number, @Query("limit") limit?: number): Promise<ConversationListDto[]> {
        return await this.conversationService.listConversations({
            user_id: user.id,
            pagination: {
                limit: limit,
                page: page
            }
        });
    }

    @Get(":conversation_id")
    async getConversationParticipants(@User() user: UserInterface, @Param("conversation_id") id: number): Promise<UserListDto[]> {
        return await this.conversationService.getConversationParticipants({
            conversation_id: id,
            user_id: user.id
        });
    }

    @Get(":conversation_id/messages")
    async getConversationMessages(@User() user: UserInterface, @Param("conversation_id") id: number, @Query("before") before?: Date, @Query("limit") limit?: number): Promise<ConversationMessage[]> {
        return await this.conversationService.getConversationMessages({
            user_id: user.id,
            conversation_id: id,
            before: before,
            limit: limit
        });
    }

    @Delete("/message/:message_id")
    async deleteMessage(@User() user: UserInterface, @Param("message_id") id: number): Promise<boolean> {
        return await this.conversationService.deleteMessage({
            user_id: user.id,
            message_id: id
        });
    }
}
