use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::prelude::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow)]
pub struct Conversation {
    pub conversation_id: i32,
    pub title: String,
    pub farm_id: Uuid,
    pub lastest_message: i64,
    pub created_at: DateTime<Utc>,
}
