use derive_more::Display;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Display)]
pub enum Event {
    #[display("connect")]
    Connect,

    #[display("join")]
    Join,

    #[display("message")]
    Message,

    #[display("leave")]
    Leave,

    #[display("error")]
    Error,
}

#[derive(Debug, Deserialize)]
pub struct WSRequest {
    pub id: String,
    pub event: Event,
    pub data: serde_json::Value,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct WSResponse {
    pub id: String,
    pub event: Event,
    pub data: serde_json::Value,
    pub status: String,
}
