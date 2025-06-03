use farmera_grpc_proto::communication::{
    ConversationDto, ConversationMessage, CreateConversationRequest, CreateConversationResponse,
    GetConversationMessagesRequest, GetConversationMessagesResponse, GetConversationResponse,
    ListConversationsResponse,
};

use crate::models::{
    common_mapping_impl::*,
    conversation::{
        Conversation, ConversationList, GetConversationDTO, MessageParams, NewConversation,
    },
};

// Convert grpc CreateConversationRequest to NewConversation model
impl TryFrom<CreateConversationRequest> for NewConversation {
    type Error = &'static str;

    fn try_from(value: CreateConversationRequest) -> Result<Self, Self::Error> {
        if value.titile.is_empty() {
            return Err("Title cannot be empty");
        }

        Ok(NewConversation {
            title: value.titile,
        })
    }
}

// Convert Conversation model to grpc CreateConversationResponse
impl From<Conversation> for CreateConversationResponse {
    fn from(value: Conversation) -> Self {
        CreateConversationResponse {
            conversation_id: value.conversation_id,
            title: value.title,
            latest_message: value.latest_message,
            created_at: Some(datetime_to_grpc_timestamp(value.created_at)),
        }
    }
}

// Convert Conversation model to grpc GetConversationResponse
impl From<Conversation> for GetConversationResponse {
    fn from(value: Conversation) -> Self {
        GetConversationResponse {
            conversation_id: value.conversation_id,
            title: value.title,
            latest_message: value.latest_message,
            created_at: Some(datetime_to_grpc_timestamp(value.created_at)),
        }
    }
}

// Convert grpc GetConvsercationMessagesRequest to MessageParams model
impl TryFrom<GetConversationMessagesRequest> for MessageParams {
    type Error = &'static str;

    fn try_from(value: GetConversationMessagesRequest) -> Result<Self, Self::Error> {
        let before = if value.before.is_some() {
            Some(
                grpc_timestamp_to_datetime(value.before.unwrap())
                    .map_err(|_| "Invalid timestamp value")?,
            )
        } else {
            None
        };

        let limit = if value.limit.is_some() {
            Some(value.limit.unwrap())
        } else {
            None
        };

        Ok(MessageParams { before, limit })
    }
}

// convert ConversationMessage model to grpc GetConversationMessageResponse
impl From<CvsMsg> for GetConversationMessagesResponse {
    fn from(value: CvsMsg) -> Self {
        let messages = value
            .messages
            .into_iter()
            .map(ConversationMessage::from)
            .collect::<Vec<ConversationMessage>>();

        GetConversationMessagesResponse { messages }
    }
}

// convert GetConversationDTO model to grpc ConversationDTO
impl From<GetConversationDTO> for ConversationDto {
    fn from(value: GetConversationDTO) -> Self {
        ConversationDto {
            id: value.id,
            conversation_id: value.conversation_id,
            title: value.title,
            sender_id: value.sender_id.map(|v| v.to_string()),
            content: value.content,
            sent_at: value.sent_at.map(|v| datetime_to_grpc_timestamp(v)),
            is_read: value.is_read,
            r#type: value.r#type.map(|v| v as i32),
        }
    }
}

// Convert ConversationList model to grpc ListConversationResponse
impl From<ConversationList> for ListConversationsResponse {
    fn from(value: ConversationList) -> Self {
        let conversations = value
            .conversations
            .into_iter()
            .map(ConversationDto::from)
            .collect::<Vec<ConversationDto>>();

        ListConversationsResponse { conversations }
    }
}
