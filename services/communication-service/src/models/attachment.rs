use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow, ToSchema)]
pub struct Attachment {
    #[schema(example = 1)]
    pub attachment_id: i32,

    #[schema(example = 1)]
    pub message_id: Option<i64>,

    #[schema(example = 1)]
    pub conversation_id: Option<i32>,

    #[schema(example = "uploads/video/video1.mp4")]
    pub file_url: String,

    #[schema(example = 1024)]
    pub file_size: i32,

    #[schema(example = "video")]
    pub file_type: String,

    #[schema(example = "2025-04-15T08:14:17.923998Z")]
    pub created: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct AttachmentParams {
    pub before: Option<DateTime<Utc>>,
    #[serde(default = "default_limit")]
    pub limit: Option<i32>,
}

fn default_limit() -> Option<i32> {
    Some(20)
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SentMedia {
    pub sender_id: Uuid,
    pub r#type: String,
    pub timestamp: DateTime<Utc>,
    pub media: Vec<MediaContent>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct MediaContent {
    pub url: String,
    pub size: i32,
    pub r#type: String,
}
