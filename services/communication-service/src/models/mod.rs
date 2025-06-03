use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

pub mod attachment;
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
