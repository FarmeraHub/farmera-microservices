use std::collections::HashMap;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug, Serialize, FromRow)]
pub struct Notification {
    pub notification_id: i64,
    pub template_id: Option<i32>,
    pub title: String,
    pub content: String,
    pub channel: String,
    pub created: DateTime<Utc>,
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

#[derive(Debug, Deserialize)]
pub struct NewNotification {
    pub template_id: Option<i32>,
    pub title: String,
    pub content: String,
    pub channel: String,
}

#[derive(Debug, Deserialize)]
pub struct NewTemplateNotification {
    pub template_id: i32,
    pub title: String,
    pub props: HashMap<String, String>,
    pub channel: String,
}
