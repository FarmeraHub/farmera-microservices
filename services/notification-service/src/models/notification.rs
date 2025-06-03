use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use std::collections::HashMap;
use utoipa::ToSchema;
use uuid::Uuid;

use super::{Channel, NotificationType, email, reject_empty_string};

#[derive(Debug, Serialize, FromRow, ToSchema)]
pub struct Notification {
    #[schema(example = 1)]
    pub notification_id: i64,

    #[schema(example = 1)]
    pub template_id: Option<i32>,

    #[schema(example = "Title")]
    pub title: String,

    #[schema(example = "Content")]
    pub content: String,

    pub channel: Channel,

    #[schema(example = "2025-04-15T08:14:17.923998Z")]
    pub created: DateTime<Utc>,

    #[schema(example = "2025-04-15T08:14:17.923998Z")]
    pub updated: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct NotificationParams {
    #[serde(deserialize_with = "reject_empty_string")]
    #[serde(default = "default_order")]
    pub order: String,

    #[serde(default = "default_limit")]
    pub limit: i32,

    #[serde(default)]
    pub asc: bool,
}

fn default_order() -> String {
    String::from("created")
}
fn default_limit() -> i32 {
    20
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct NewNotification {
    #[schema(ignore)]
    #[serde(skip)]
    pub template_id: Option<i32>,

    #[serde(deserialize_with = "reject_empty_string")]
    #[schema(example = "Title")]
    pub title: String,

    #[serde(deserialize_with = "reject_empty_string")]
    #[schema(example = "Content")]
    pub content: String,

    pub channel: Channel,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct NewTemplateNotification {
    #[schema(example = 1)]
    pub template_id: i32,

    #[serde(deserialize_with = "reject_empty_string")]
    #[schema(example = "Titile")]
    pub title: String,

    #[schema(example = r#"{"name": "john", "age": "30"}"#)]
    pub props: HashMap<String, String>,

    pub channel: Channel,
}

#[derive(Debug, Deserialize, ToSchema, Clone)]
pub struct SendNotification {
    #[schema(value_type = String)]
    pub recipent: Option<Uuid>,

    pub notification_type: NotificationType,

    pub channels: Vec<Channel>,

    pub from: email::Email,

    #[serde(deserialize_with = "reject_empty_string")]
    #[schema(example = "Title")]
    pub title: String,

    #[schema(example = "Content")]
    pub content: Option<String>,

    #[serde(default = "default_content_type")]
    #[serde(deserialize_with = "reject_empty_string")]
    #[schema(example = "text/plain")]
    pub content_type: String,

    #[schema(example = 1)]
    pub template_id: Option<i32>,

    #[schema(example = r#"{"name": "john", "age": "30"}"#)]
    pub template_props: Option<HashMap<String, String>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub attachments: Option<Vec<email::Attachments>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    #[schema(value_type = email::Email)]
    pub reply_to: Option<email::Email>,

    #[schema(ignore)]
    #[serde(default)]
    pub retry_count: u8,

    #[schema(ignore)]
    #[serde(default)]
    pub retry_ids: HashMap<String, i64>,

    #[schema(ignore)]
    #[serde(default)]
    pub id: i64,
}

fn default_content_type() -> String {
    "text/plain".to_string()
}
