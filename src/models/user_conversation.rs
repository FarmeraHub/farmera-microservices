use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::prelude::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow)]
pub struct UserConversation {
    pub id: i64,
    pub conversation_id: i32,
    pub user_id: Uuid,
    pub deleted_at: DateTime<Utc>,
}
