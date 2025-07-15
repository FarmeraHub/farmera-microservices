use serde::{Deserialize, Serialize};

pub mod push;

pub type NotiType = NotificationType;

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum NotificationType {
    Transactional,
    SystemAlert,
    Chat,
}
