use serde::{Deserialize, Deserializer, Serialize, de::Error};
use utoipa::ToSchema;
use uuid::Uuid;

pub mod email;
pub mod grpc_impl;
pub mod notification;
pub mod push;
pub mod reponse_wrapper;
pub mod template;
pub mod user_preferences;

#[derive(Debug, Deserialize, ToSchema)]
pub struct UserIdQuery {
    #[schema(value_type = String, example = "550e8400-e29b-41d4-a716-446655440001")]
    pub user_id: Uuid,
}

#[derive(Debug, Deserialize, Serialize, ToSchema, sqlx::Type, Clone, Hash, PartialEq, Eq)]
#[sqlx(type_name = "TEXT")]
#[serde(rename_all = "lowercase")]
pub enum Channel {
    Email,
    Push,
}

#[derive(Debug, Deserialize, Serialize, Clone, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum NotificationType {
    Transactional,
    SystemAlert,
    Chat,
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
