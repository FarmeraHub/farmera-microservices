use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow)]
pub struct UserPreferences {
    pub user_id: Uuid,
    pub user_email: String,
    pub transactional_channels: Vec<String>,
    pub system_alert_channels: Vec<String>,
    pub chat_channels: Vec<String>,
    pub do_not_disturb_start: DateTime<Utc>,
    pub do_not_disturb_end: DateTime<Utc>,
    pub daily_limits: i32,
    pub sent_today: i32,
}

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub struct UserDeviceToken {
    pub user_id: Uuid,
    pub token: String,
}

#[derive(Debug, Deserialize)]
pub struct NewUserPreferences {
    pub user_id: Uuid,
    pub user_email: String,
    pub transactional_channels: Vec<String>,
    pub system_alert_channels: Vec<String>,
    pub chat_channels: Vec<String>,
    pub do_not_disturb_start: DateTime<Utc>,
    pub do_not_disturb_end: DateTime<Utc>,
    pub daily_limits: i32,
}
