use chrono::NaiveTime;
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

use super::Channel;
use super::reject_empty_string;

#[derive(Debug, Serialize, FromRow, ToSchema)]
pub struct UserPreferences {
    #[schema(value_type = String, example = "550e8400-e29b-41d4-a716-446655440001")]
    pub user_id: Uuid,

    #[schema(example = "example@gmail.com")]
    #[serde(deserialize_with = "reject_empty_string")]
    pub user_email: String,

    #[schema(value_type = Vec<Channel>, example = r#"["email", "push"]"#)]
    pub transactional_channels: Vec<Channel>,

    #[schema(value_type = Vec<Channel>, example = r#"["email", "push"]"#)]
    pub system_alert_channels: Vec<Channel>,

    #[schema(value_type = Vec<Channel>, example = r#"["email", "push"]"#)]
    pub chat_channels: Vec<Channel>,

    #[schema(value_type = String, example = "08:14:17.923998")]
    pub do_not_disturb_start: Option<NaiveTime>,

    #[schema(value_type = String, example = "08:14:17.923998")]
    pub do_not_disturb_end: Option<NaiveTime>,

    #[schema(value_type = String, example = "America/New_York")]
    pub time_zone: String,
}

#[derive(Debug, Deserialize, Serialize, FromRow, ToSchema)]
pub struct UserDeviceToken {
    #[schema(value_type = String, example = "550e8400-e29b-41d4-a716-446655440001")]
    pub user_id: Uuid,

    #[schema(value_type = String, example = "550e8...")]
    pub token: String,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct NewUserPreferences {
    #[schema(value_type = String, example = "550e8400-e29b-41d4-a716-446655440001")]
    pub user_id: Uuid,

    #[schema(value_type = String, example = "example@gmail.com")]
    #[serde(deserialize_with = "reject_empty_string")]
    pub user_email: String,

    #[schema(value_type = Vec<Channel>, example = r#"["email", "push"]"#)]
    pub transactional_channels: Vec<Channel>,

    #[schema(value_type = Vec<Channel>, example = r#"["email", "push"]"#)]
    pub system_alert_channels: Vec<Channel>,

    #[schema(value_type = Vec<Channel>, example = r#"["email", "push"]"#)]
    pub chat_channels: Vec<Channel>,

    #[schema(example = "08:14:17.923998")]
    pub do_not_disturb_start: Option<NaiveTime>,

    #[schema(example = "08:14:17.923998")]
    pub do_not_disturb_end: Option<NaiveTime>,

    #[schema(value_type = String, example = "America/New_York")]
    #[serde(deserialize_with = "reject_empty_string")]
    pub time_zone: String,
}
