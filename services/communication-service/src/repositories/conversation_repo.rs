use std::sync::Arc;

use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::db_error::DBError,
    models::{
        conversation::{Conversation, GetConversationDTO},
        message::Message,
        user_conversation::UserConversation,
    },
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

    pub async fn find_participants_by_conversation_id(
        &self,
        user_id: Uuid,
        conversation_id: i32,
    ) -> Result<Vec<UserConversation>, DBError> {
        if self
            .find_conversation_by_id(conversation_id)
            .await?
            .is_none()
        {
            return Ok(Vec::new());
        }

        let existed = self
            .check_user_in_conversation(conversation_id, user_id)
            .await?;

        if existed.unwrap_or_default() < 1 {
            return Err(DBError::NotFound("User not found".to_string()));
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
        user_id: Uuid,
        conversation_id: i32,
        limit: Option<i32>,
        before: Option<DateTime<Utc>>,
    ) -> Result<Vec<Message>, DBError> {
        // check user in conversation
        let existed = self
            .check_user_in_conversation(conversation_id, user_id)
            .await?;

        if existed.unwrap_or_default() < 1 {
            return Err(DBError::NotFound("User not found".to_string()));
        }

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

    pub async fn get_conversation_by_user_id(
        &self,
        user_id: Uuid,
        limit: i32,
        offset: i32,
    ) -> Result<Vec<GetConversationDTO>, DBError> {
        let stm = include_str!("./queries/conversation/get_conversation_by_user_id.sql");

        let result = sqlx::query_as(stm)
            .bind(user_id)
            .bind(limit)
            .bind(offset)
            .fetch_all(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Fetching conversation error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn insert_private_conversation(
        &self,
        title: &str,
        user_a: Uuid,
        user_b: Uuid,
    ) -> Result<Conversation, DBError> {
        let insert_conversation_stm =
            include_str!("./queries/conversation/insert_conversation.sql");
        let insert_user_convsersation_stm =
            include_str!("./queries/user_conversation/insert_user_conversation.sql");

        let mut tx = self.pg_db_pool.begin().await.map_err(|e| {
            log::error!("Failed to begin transaction: {}", e);
            DBError::TransactionError("Failed to begin transaction".to_string())
        })?;

        let conversation: Conversation = sqlx::query_as(insert_conversation_stm)
            .bind(title)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| {
                log::error!("Insert user in conversation error: {e}");
                DBError::QueryError(e)
            })?;

        let conversation_id = conversation.conversation_id;
        sqlx::query(insert_user_convsersation_stm)
            .bind(conversation_id)
            .bind(user_a)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                log::error!("Insert user in conversation error: {e}");
                DBError::QueryError(e)
            })?;

        let conversation_id = conversation.conversation_id;
        sqlx::query(insert_user_convsersation_stm)
            .bind(conversation_id)
            .bind(user_b)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                log::error!("Insert user in conversation error: {e}");
                DBError::QueryError(e)
            })?;

        tx.commit().await.map_err(|e| {
            log::error!("Failed to commit transaction: {}", e);
            DBError::TransactionError("Failed to commit transaction".to_string())
        })?;

        Ok(conversation)
    }

    pub async fn get_unread_count(&self, user_id: Uuid) -> Result<i64, DBError> {
        let stm = include_str!("./queries/conversation/unread_count.sql");

        let (count,): (i64,) = sqlx::query_as(stm)
            .bind(user_id)
            .fetch_one(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Get unread message count error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(count)
    }

    pub async fn mark_as_read(&self, conversation_id: i32, user_id: Uuid) -> Result<bool, DBError> {
        let stm = include_str!("./queries/conversation/mark_as_read.sql");

        let result = sqlx::query(stm)
            .bind(conversation_id)
            .bind(user_id)
            .execute(&*self.pg_db_pool)
            .await
            .map_err(|e| {
                log::error!("Get unread message count error: {e}");
                DBError::QueryError(e)
            })?;

        if result.rows_affected() == 0 {
            log::warn!("Mark message as read returns 0 rows affected");
            Ok(false)
        } else {
            Ok(true)
        }
    }
}
