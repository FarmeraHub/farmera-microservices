use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::prelude::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow, ToSchema)]
pub struct Message {
    #[schema(example = 1)]
    pub message_id: i64,

    #[schema(example = 1)]
    pub conversation_id: i32,

    #[schema(value_type = String, format = "uuid", example = "c8dd591b-4105-4608-869b-1dfb96f313b3")]
    pub sender_id: Uuid,

    #[schema(example = "this is the first message")]
    pub content: String,

    #[schema(example = "2025-04-15T08:14:17.923998Z")]
    pub sent_at: DateTime<Utc>,

    #[schema(example = "message")]
    pub r#type: String,
}

#[derive(Serialize)]
pub struct SentMessage {
    pub sender_id: Uuid,
    pub r#type: String,
    pub message: String,
    pub timestamp: DateTime<Utc>,
}
