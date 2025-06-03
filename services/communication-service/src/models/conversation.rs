use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use utoipa::ToSchema;

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
