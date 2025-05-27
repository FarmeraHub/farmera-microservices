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

    pub async fn insert_template(&self, name: &str, content: &str) -> Result<Template, DBError> {
        let stm = include_str!("./queries/template/insert_template.sql");

        let result = sqlx::query_as(stm)
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

    pub async fn get_templates(
        &self,
        order: &str,
        limit: i32,
        asc: bool,
    ) -> Result<Vec<Template>, DBError> {
        let stm = include_str!("./queries/template/get_templates.sql");
        let valid_columns = ["template_id", "name", "created", "updated"].to_vec();
        if !valid_columns.contains(&order) {
            return Err(DBError::QueryFailed("Invalid column".to_string()));
        }

        let stm = stm
            .replace("{{order}}", order)
            .replace("{{asc}}", if asc { "ASC" } else { "DESC" });

        let result = sqlx::query_as(&stm)
            .bind(limit)
            .fetch_all(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Fetching template error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }
}
