use serde::Serialize;

#[derive(Serialize)]
pub struct Response {
    pub r#type: String,
    pub message: String,
}
