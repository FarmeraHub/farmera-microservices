use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use utoipa::ToSchema;

#[derive(Debug, Serialize, FromRow, ToSchema)]
pub struct Template {
    #[schema(example = 1)]
    pub template_id: i32,

    #[schema(example = "Template")]
    pub name: String,

    #[schema(example = "Hello {{name}}")]
    pub content: String,

    #[schema(example = "2025-04-15T08:14:17.923998Z")]
    pub created: DateTime<Utc>,

    #[schema(example = "2025-04-15T08:14:17.923998Z")]
    pub updated: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct TemplateParams {
    #[serde(default = "default_order")]
    pub order: String,
    #[serde(default = "default_limit")]
    pub limit: i32,
    #[serde(default)]
    pub asc: bool,
}

fn default_order() -> String {
    String::from("created")
}
fn default_limit() -> i32 {
    20
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct NewTemplate {
    #[schema(example = "Template")]
    pub name: String,

    #[schema(example = "Hello {{name}}")]
    pub content: String,
}
