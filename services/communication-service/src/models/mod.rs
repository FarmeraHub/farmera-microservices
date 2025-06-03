use serde::{de::Error, Deserialize, Deserializer, Serialize};
use utoipa::ToSchema;

pub mod attachment;
pub mod common_mapping_impl;
pub mod communication_mapping_impl;
pub mod conversation;
pub mod message;
pub mod notification_mapping_impl;
pub mod notification_models;
pub mod response_wrapper;
pub mod upload_form;
pub mod user_conversation;
pub mod ws;

#[derive(Debug, Deserialize, Serialize, ToSchema, sqlx::Type)]
#[sqlx(type_name = "TEXT")]
#[serde(rename_all = "lowercase")]
pub enum MessageType {
    Media,
    Message,
}

pub fn reject_empty_string<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    let s: String = Deserialize::deserialize(deserializer)?;
    if s.trim().is_empty() {
        return Err(D::Error::invalid_value(
            serde::de::Unexpected::Str(&s),
            &"a non-empty string",
        ));
    }
    Ok(s)
}

#[derive(Debug, Deserialize)]
pub struct Pagination {
    #[serde(default = "default_page")]
    pub page: i32,
    #[serde(default = "default_limit")]
    pub limit: i32,
}

fn default_page() -> i32 {
    1
}

fn default_limit() -> i32 {
    20
}
