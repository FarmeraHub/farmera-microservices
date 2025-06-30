use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::models::{message::Message, MessageType};

use super::reject_empty_string;

#[derive(Debug, Serialize, FromRow, ToSchema)]
pub struct Conversation {
    #[schema(example = 1)]
    pub conversation_id: i32,

    #[schema(example = "Title")]
    pub title: String,

    #[schema(example = 1)]
    pub latest_message: Option<i64>,

    #[schema(example = "2025-04-15T08:14:17.923998Z")]
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct NewConversation {
    #[schema(example = "New conversation")]
    #[serde(deserialize_with = "reject_empty_string")]
    pub title: String,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct NewPrivateConversation {
    #[schema(example = "New conversation")]
    #[serde(deserialize_with = "reject_empty_string")]
    pub title: String,

    #[schema(value_type = String, format = "uuid", example = "c8dd591b-4105-4608-869b-1dfb96f313b3")]
    pub other_user_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct MessageParams {
    pub before: Option<DateTime<Utc>>,
    #[serde(default = "default_limit")]
    pub limit: Option<i32>,
}

fn default_limit() -> Option<i32> {
    Some(20)
}

// Message wrapper returns when retrieving messages from a conversation
#[derive(Debug, Serialize, ToSchema)]
pub struct ConversationMessages {
    pub messages: Vec<Message>,
}

// use to get a conversation with it latest message
#[derive(Debug, Serialize, ToSchema, FromRow)]
pub struct GetConversationDTO {
    pub id: i64,
    pub conversation_id: i32,
    pub title: String,
    pub message_id: Option<i64>,
    #[schema(value_type = String, format = "uuid", example = "c8dd591b-4105-4608-869b-1dfb96f313b3")]
    pub sender_id: Option<Uuid>,
    pub content: Option<String>,
    pub sent_at: Option<DateTime<Utc>>,
    pub is_read: Option<bool>,
    pub r#type: Option<MessageType>,
    #[schema(value_type = Vec<String>, format = "uuid", example = json!["c8dd591b-4105-4608-869b-1dfb96f313b3"])]
    pub participants: Vec<Uuid>,
}

// GetConversationDTO wrapper
#[derive(Debug, Serialize, ToSchema)]
pub struct ConversationList {
    pub conversations: Vec<GetConversationDTO>,
}
