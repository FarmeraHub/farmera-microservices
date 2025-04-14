use std::sync::Arc;

use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::db_error::DBError;

pub struct MessageRepo {
    pg_db_pool: Arc<PgPool>,
}

impl MessageRepo {
    pub fn new(pg_db_pool: Arc<PgPool>) -> Self {
        Self { pg_db_pool }
    }

    pub async fn insert_message(
        &self,
        conversation_id: i32,
        sender_id: Uuid,
        content: &str,
        is_read: bool,
    ) -> Result<i64, DBError> {
        let stm = include_str!("./queries/message/insert_message.sql");

        let result: i64 = sqlx::query_scalar(stm)
            .bind(conversation_id)
            .bind(sender_id)
            .bind(content)
            .bind(is_read)
            .fetch_one(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Insert message error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn delete_message(&self, message_id: i64) -> Result<u64, DBError> {
        let stm = include_str!("./queries/message/delete_message.sql");

        let result = sqlx::query(stm)
            .bind(message_id)
            .execute(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Delete message error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result.rows_affected())
    }
}
