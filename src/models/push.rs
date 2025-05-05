use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PushMessage {
    pub recipient: Vec<String>,
    pub r#type: String, // token, topic, condition
    pub template_id: Option<i32>,
    pub template_props: HashMap<String, String>,
    pub title: String,
    pub content: Option<String>,
    #[serde(default)]
    pub retry_count: u8,
}
