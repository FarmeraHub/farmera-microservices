use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::reject_empty_string;

#[derive(Debug, Deserialize, Serialize, Clone, ToSchema)]
pub struct PushMessage {
    #[schema(example = r#"["f02NdH5...", "f2hsUS0..,", "az01GX..."]"#)]
    pub recipient: Vec<String>,

    #[serde(deserialize_with = "reject_empty_string")]
    #[schema(example = "token")]
    pub r#type: String, // token, topic, condition

    #[schema(example = 1)]
    pub template_id: Option<i32>,

    #[schema(example = r#"{"name": "john", "age": "30"}"#)]
    pub template_props: Option<HashMap<String, String>>,

    #[serde(deserialize_with = "reject_empty_string")]
    #[schema(example = "Title")]
    pub title: String,

    #[schema(example = "Content")]
    pub content: Option<String>,

    #[schema(ignore)]
    #[serde(default)]
    pub retry_count: u8,

    #[schema(ignore)]
    #[serde(default)]
    pub retry_ids: HashMap<String, i64>,
}
