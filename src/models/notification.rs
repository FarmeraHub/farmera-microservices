use std::collections::HashMap;

use chrono::{DateTime, Utc};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Notification {
    notification_id: i64,
    template_id: Option<i32>,
    title: String,
    content: serde_json::Value,
    channel: String,
    created: DateTime<Utc>,
    updated: DateTime<Utc>,
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
