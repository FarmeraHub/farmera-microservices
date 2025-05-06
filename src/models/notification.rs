use std::collections::HashMap;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use utoipa::ToSchema;

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

    #[schema(example = "push")]
    pub channel: String,

    #[schema(example = "2025-04-15T08:14:17.923998Z")]
    pub created: DateTime<Utc>,

    #[schema(example = "2025-04-15T08:14:17.923998Z")]
    pub updated: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct NotificationParams {
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

    #[schema(example = "Title")]
    pub title: String,

    #[schema(example = "Content")]
    pub content: String,

    #[schema(example = "push")]
    pub channel: String,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct NewTemplateNotification {
    #[schema(example = 1)]
    pub template_id: i32,

    #[schema(example = "Titile")]
    pub title: String,

    #[schema(example = r#"{"name": "john", "age": "30"}"#)]
    pub props: HashMap<String, String>,

    #[schema(example = "push")]
    pub channel: String,
}
