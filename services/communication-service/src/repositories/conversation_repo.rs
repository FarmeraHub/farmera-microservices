use std::sync::Arc;

use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::db_error::DBError,
    models::{conversation::Conversation, message::Message, user_conversation::UserConversation},
};

pub struct ConversationRepo {
    pg_db_pool: Arc<PgPool>,
}

impl ConversationRepo {
    pub fn new(pg_db_pool: Arc<PgPool>) -> Self {
        Self { pg_db_pool }
    }

    pub async fn find_conversation_by_id(&self, id: i32) -> Result<Option<Conversation>, DBError> {
        let stm = include_str!("./queries/conversation/find_conversation_by_id.sql");

        let result: Option<Conversation> = sqlx::query_as(stm)
            .bind(id)
            .fetch_optional(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Fetching conversation error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn insert_conversation(&self, title: &str) -> Result<Conversation, DBError> {
        let stm = include_str!("./queries/conversation/insert_conversation.sql");

        let result = sqlx::query_as(stm)
            .bind(title)
            .fetch_one(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Insert conversation error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn insert_conversation_user(
        &self,
        conversation_id: i32,
        user_id: Uuid,
    ) -> Result<i64, DBError> {
        let stm = include_str!("./queries/user_conversation/insert_user_conversation.sql");

        let result = sqlx::query_scalar(stm)
            .bind(conversation_id)
            .bind(user_id)
            .fetch_one(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Insert user in conversation error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn find_users_by_conversation_id(
        &self,
        conversation_id: i32,
    ) -> Result<Vec<UserConversation>, DBError> {
        if self
            .find_conversation_by_id(conversation_id)
            .await?
            .is_none()
        {
            return Ok(Vec::new());
        }
        let stm = include_str!("./queries/user_conversation/find_users_by_conversation_id.sql");

        let result: Vec<UserConversation> = sqlx::query_as(stm)
            .bind(conversation_id)
            .fetch_all(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Fetching users error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn check_user_in_conversation(
        &self,
        conversation_id: i32,
        user_id: Uuid,
    ) -> Result<Option<i64>, DBError> {
        let stm = include_str!("./queries/user_conversation/check_user_in_conversation.sql");

        let result: Option<(i64,)> = sqlx::query_as(stm)
            .bind(user_id)
            .bind(conversation_id)
            .fetch_optional(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Fetching users_conversation error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result.map(|r| r.0))
    }

    pub async fn delete_conversation(&self, conversation_id: i32) -> Result<u64, DBError> {
        let stm = include_str!("./queries/conversation/delete_conversation.sql");

        let result = sqlx::query(stm)
            .bind(conversation_id)
            .execute(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Delete users_conversation error: {e}");
                DBError::QueryError(e)
            })?;

        if result.rows_affected() == 0 {
            log::error!("Delete user_conversation returns 0 rows affected");
            Err(DBError::QueryFailed("0 rows affected".to_string()))
        } else {
            Ok(result.rows_affected())
        }
    }

    pub async fn get_messages_by_conversation_id(
        &self,
        conversation_id: i32,
        limit: Option<i32>,
        before: Option<DateTime<Utc>>,
    ) -> Result<Vec<Message>, DBError> {
        let stm = include_str!("./queries/conversation/get_messages_by_conversation_id.sql");

        let result: Vec<Message> = sqlx::query_as(stm)
            .bind(conversation_id)
            .bind(before)
            .bind(limit)
            .fetch_all(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Fetching messages in conversation error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }
}
