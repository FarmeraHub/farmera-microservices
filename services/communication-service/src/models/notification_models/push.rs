use std::collections::HashMap;

use derive_more::Display;

#[derive(Debug, Clone, Display)]
pub enum PushMessageType {
    #[display("token")]
    Token,
    #[display("topic")]
    Topic,
    #[display("condition")]
    Condition,
}

#[derive(Debug, Clone)]
pub struct PushMessage {
    pub recipient: Vec<String>,
    pub r#type: PushMessageType, // token, topic, condition
    pub template_id: Option<i32>,
    pub template_props: Option<HashMap<String, String>>,
    pub title: String,
    pub content: Option<String>,
}
