use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug, Serialize, FromRow)]
pub struct Template {
    pub template_id: i32,
    pub name: String,
    pub content: String,
    pub created: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct NewTemplate {
    pub name: String,
    pub content: String,
}
