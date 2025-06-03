use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::reject_empty_string;

#[derive(Debug, Deserialize, Serialize, Clone, ToSchema)]
pub struct EmailMessage {
    #[schema(
        example = r#"[{ "email": "alex@example.com", "name": "Alex"}, {"email": "bola@example.com", "name": "Bola" }]"#
    )]
    pub to: Vec<Email>,

    #[schema(
        example = r#"{ "email": "orders@example.com", "name": "Example Order Confirmation"}"#
    )]
    pub from: Email,

    #[schema(example = 1)]
    pub template_id: Option<i32>,

    #[schema(example = r#"{"name": "john", "age": "30"}"#)]
    pub template_props: Option<HashMap<String, String>>,

    #[schema(example = "Subject")]
    #[serde(deserialize_with = "reject_empty_string")]
    pub subject: String,

    #[schema(example = "Content")]
    pub content: Option<String>,

    #[schema(example = "text/plain")]
    #[serde(deserialize_with = "reject_empty_string")]
    #[serde(default = "default_content_type")]
    pub content_type: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub attachments: Option<Vec<Attachments>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    #[schema(value_type = Email)]
    pub reply_to: Option<Email>,

    #[schema(ignore)]
    #[serde(default)]
    pub retry_count: u8,

    #[schema(ignore)]
    #[serde(default)]
    pub retry_ids: HashMap<String, i64>,

    #[schema(ignore)]
    #[serde(default)]
    pub id: i64,
}

fn default_content_type() -> String {
    "text/plain".to_string()
}

#[derive(Debug, Deserialize, Serialize, Clone, ToSchema)]
pub struct Email {
    #[serde(deserialize_with = "reject_empty_string")]
    #[schema(example = "email@example.com")]
    pub email: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    #[schema(example = "example")]
    pub name: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone, ToSchema)]
pub struct Attachments {
    #[serde(deserialize_with = "reject_empty_string")]
    #[schema(
        example = "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KCiAgICA8aGVhZD4KICAgICAgICA8bWV0YSBjaGFyc2V0PSJVVEYtOCI+CiAgICAgICAgPG1ldGEgaHR0cC1lcXVpdj0iWC1VQS1Db21wYXRpYmxlIiBjb250ZW50PSJJRT1lZGdlIj4KICAgICAgICA8bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMCI+CiAgICAgICAgPHRpdGxlPkRvY3VtZW50PC90aXRsZT4KICAgIDwvaGVhZD4KCiAgICA8Ym9keT4KCiAgICA8L2JvZHk+Cgo8L2h0bWw+Cg=="
    )]
    pub content: String,

    #[serde(deserialize_with = "reject_empty_string")]
    #[schema(example = "index.html")]
    pub filename: String,

    #[serde(rename = "type", deserialize_with = "reject_empty_string")]
    #[schema(example = "text/html")]
    pub r#type: String,

    #[serde(
        default = "default_disposition",
        deserialize_with = "reject_empty_string"
    )]
    #[schema(example = "attachment")]
    pub disposition: String,
}

fn default_disposition() -> String {
    "attachment".to_string()
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct SendGridEvent {
    pub email: Option<String>,
    pub timestamp: i64,
    #[serde(rename = "smtp-id")]
    pub smtp_id: Option<String>,
    pub event: String,
    pub category: Option<String>,
    pub sg_event_id: String,
    pub sg_message_id: Option<String>,

    // Common optional fields
    pub ip: Option<String>,
    pub useragent: Option<String>,
    pub url: Option<String>,
    pub response: Option<String>,
    pub attempt: Option<String>,
    pub status: Option<String>,
    pub reason: Option<String>,
    pub bounce_classification: Option<String>,
    pub asm_group_id: Option<i64>,
    pub sg_machine_open: Option<bool>,

    pub custom_args: Option<HashMap<String, String>>,

    // For event: account_status_change
    #[serde(default)]
    pub r#type: Option<String>,
}
