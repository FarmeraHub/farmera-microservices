use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug, Serialize, FromRow)]
pub struct Conversation {
    pub conversation_id: i32,
    pub title: String,
    pub lastest_message: Option<i64>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct NewConversation {
    pub title: String,
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
