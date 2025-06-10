use std::sync::Arc;

use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::db_error::DBError,
    models::{message::Message, MessageType},
};

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
        content: Option<String>,
        r#type: MessageType,
        sent_at: DateTime<Utc>,
        is_read: bool,
    ) -> Result<i64, DBError> {
        let stm = include_str!("./queries/message/insert_message.sql");

        let result: i64 = sqlx::query_scalar(stm)
            .bind(conversation_id)
            .bind(sender_id)
            .bind(content)
            .bind(r#type)
            .bind(sent_at)
            .bind(is_read)
            .fetch_one(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Insert message error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn delete_message(&self, user_id: Uuid, message_id: i64) -> Result<u64, DBError> {
        let stm = include_str!("./queries/message/delete_message.sql");

        let result = sqlx::query(stm)
            .bind(message_id)
            .bind(user_id)
            .execute(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Delete message error: {e}");
                DBError::QueryError(e)
            })?;

        if result.rows_affected() == 0 {
            log::error!("Delete message returns 0 rows affected");
            Err(DBError::QueryFailed("0 rows affected".to_string()))
        } else {
            Ok(result.rows_affected())
        }
    }

    pub async fn find_message_by_id(&self, message_id: i64) -> Result<Option<Message>, DBError> {
        let stm = include_str!("./queries/message/find_message_by_id.sql");

        let result: Option<Message> = sqlx::query_as(stm)
            .bind(message_id)
            .fetch_optional(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Fetching message error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }
}
