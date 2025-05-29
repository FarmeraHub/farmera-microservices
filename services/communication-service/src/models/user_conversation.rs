use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::prelude::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow, ToSchema)]
pub struct UserConversation {
    #[schema(example = 1)]
    pub id: i64,

    #[schema(example = 1)]
    pub conversation_id: i32,

    #[schema(value_type = String, format = "uuid", example = "c8dd591b-4105-4608-869b-1dfb96f313b3")]
    pub user_id: Uuid,

    #[schema(value_type = Option<String>, format = "date-time")]
    pub deleted_at: Option<DateTime<Utc>>,
}
