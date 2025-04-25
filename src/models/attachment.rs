use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct Attachment {
    attachment_id: i32,
    message_id: Option<i64>,
    file_url: String,
    file_size: i32,
    file_type: String,
    created: DateTime<Utc>,
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
