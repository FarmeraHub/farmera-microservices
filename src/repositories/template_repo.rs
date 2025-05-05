use std::sync::Arc;

use sqlx::PgPool;

use crate::{errors::db_error::DBError, models::template::Template};

pub struct TemplateRepo {
    pg_pool: Arc<PgPool>,
}

impl TemplateRepo {
    pub fn new(pg_pool: Arc<PgPool>) -> Self {
        Self { pg_pool }
    }

    pub async fn get_template_by_id(&self, template_id: i32) -> Result<Option<Template>, DBError> {
        let stm = include_str!("./queries/template/get_template_by_id.sql");

        let result = sqlx::query_as(stm)
            .bind(template_id)
            .fetch_optional(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Fetching template error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn insert_template(&self, name: &str, content: &str) -> Result<i32, DBError> {
        let stm = include_str!("./queries/template/insert_template.sql");

        let result = sqlx::query_scalar(stm)
            .bind(name)
            .bind(content)
            .fetch_one(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Insert template error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }
}
