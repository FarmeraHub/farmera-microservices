use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::prelude::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow)]
pub struct Message {
    pub message_id: i64,
    pub conversation_id: i32,
    pub sender_id: Uuid,
    pub content: String,
    pub sent_at: DateTime<Utc>,
}
