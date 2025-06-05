use farmera_grpc_proto::{
    communication::{ConversationMessage, GetMessageResponse},
    MessageType,
};
use uuid::Uuid;

use crate::models::common_mapping_impl::*;
use crate::models::message::Message;

impl TryFrom<ConversationMessage> for Message {
    type Error = &'static str;

    fn try_from(value: ConversationMessage) -> Result<Self, Self::Error> {
        let grpc_msg_type =
            MessageType::try_from(value.r#type).map_err(|_| "Invalid channel value")?;

        let msg_type = MsgType::try_from(grpc_msg_type).map_err(|_| "Unsupported channel type")?;

        let user_id = Uuid::parse_str(&value.sender_id).map_err(|_| "Invalid UUID for user id")?;

        if value.sent_at.is_none() {
            return Err("sent_at cannot be none");
        }
        let sent_at = grpc_timestamp_to_datetime(value.sent_at.unwrap())
            .map_err(|_| "Invalid timestamp value")?;

        Ok(Message {
            message_id: value.message_id,
            conversation_id: value.conversation_id,
            sender_id: user_id,
            content: value.content,
            sent_at: sent_at,
            r#type: msg_type,
        })
    }
}

impl From<Message> for ConversationMessage {
    fn from(value: Message) -> Self {
        ConversationMessage {
            message_id: value.message_id,
            conversation_id: value.conversation_id,
            sender_id: value.sender_id.to_string(),
            content: value.content,
            sent_at: Some(datetime_to_grpc_timestamp(value.sent_at)),
            r#type: MessageType::from(value.r#type) as i32,
        }
    }
}

impl From<Message> for GetMessageResponse {
    fn from(value: Message) -> Self {
        GetMessageResponse {
            message_id: value.message_id,
            conversation_id: value.conversation_id,
            sender_id: value.sender_id.to_string(),
            content: value.content,
            sent_at: Some(datetime_to_grpc_timestamp(value.sent_at)),
            r#type: MessageType::from(value.r#type) as i32,
        }
    }
}
