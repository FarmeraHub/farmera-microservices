use serde::{Deserialize, Deserializer, de::Error};
use uuid::Uuid;

pub mod email;
pub mod notification;
pub mod push;
pub mod reponse;
pub mod template;
pub mod user_preferences;

#[derive(Debug, Deserialize)]
pub struct UserIdQuery {
    pub user_id: Uuid,
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
