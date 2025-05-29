use std::sync::Arc;

use chrono::{DateTime, Utc};
use sqlx::PgPool;

use crate::{
    errors::db_error::DBError,
    models::attachment::{Attachment, MediaContent},
};

pub struct AttachmentRepo {
    pg_pool: Arc<PgPool>,
}

impl AttachmentRepo {
    pub fn new(pg_pool: Arc<PgPool>) -> Self {
        Self { pg_pool }
    }

    pub async fn _insert_attachment(
        &self,
        message_id: Option<i64>,
        conversation_id: Option<i32>,
        media_content: MediaContent,
    ) -> Result<i32, DBError> {
        let stm = include_str!("./queries/attachment/insert_attachment.sql");

        let attachment_id = sqlx::query_scalar(stm)
            .bind(message_id)
            .bind(conversation_id)
            .bind(media_content.url)
            .bind(media_content.size)
            .bind(media_content.r#type)
            .fetch_one(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Insert attachment error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(attachment_id)
    }

    pub async fn bulk_insert_attachments(
        &self,
        message_id: Option<i64>,
        conversation_id: Option<i32>,
        media_contents: &Vec<MediaContent>,
    ) -> Result<Vec<i32>, DBError> {
        if media_contents.is_empty() {
            return Ok(vec![]);
        }

        let mut query = String::from(
            "INSERT INTO attachments (message_id, conversation_id, file_url, file_size, file_type) VALUES ",
        );
        let mut params: Vec<String> = vec![];
        let mut msg_id = vec![];
        let mut conversation_ids = vec![];
        let mut urls = vec![];
        let mut sizes = vec![];
        let mut types = vec![];

        for (i, media) in media_contents.iter().enumerate() {
            let base = i * 5;
            params.push(format!(
                "(${}, ${}, ${}, ${}, ${})",
                base + 1,
                base + 2,
                base + 3,
                base + 4,
                base + 5
            ));

            msg_id.push(message_id);
            conversation_ids.push(conversation_id);
            urls.push(media.url.clone());
            sizes.push(media.size);
            types.push(media.r#type.clone());
        }

        query.push_str(&params.join(","));
        query.push_str(" RETURNING attachment_id");

        // Build query and bind values manually
        let mut q = sqlx::query_scalar(&query);
        for i in 0..media_contents.len() {
            q = q
                .bind(msg_id[i])
                .bind(conversation_ids[i])
                .bind(urls[i].clone())
                .bind(sizes[i])
                .bind(types[i].clone());
        }

        let row_ids: Vec<i32> = q.fetch_all(&*self.pg_pool).await.map_err(|e| {
            log::error!("Insert bulk attachment error: {e}");
            DBError::QueryError(e)
        })?;

        Ok(row_ids)
    }

    pub async fn get_attachment_by_id(
        &self,
        attachment_id: i32,
    ) -> Result<Option<Attachment>, DBError> {
        let stm = include_str!("./queries/attachment/get_attachment_by_id.sql");

        let result = sqlx::query_as(stm)
            .bind(attachment_id)
            .fetch_optional(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Fetching attachment error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn _get_attachment_by_url(
        &self,
        file_url: &str,
    ) -> Result<Option<Attachment>, DBError> {
        let stm = include_str!("./queries/attachment/get_attachment_by_url.sql");

        let result = sqlx::query_as(stm)
            .bind(file_url)
            .fetch_optional(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Fetching attachment error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn get_attachment_by_message_id(
        &self,
        message_id: i64,
    ) -> Result<Vec<Attachment>, DBError> {
        let stm = include_str!("./queries/attachment/get_attachment_by_message_id.sql");

        let result = sqlx::query_as(stm)
            .bind(message_id)
            .fetch_all(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Fetching attachment error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn get_attachments_by_conversation_id(
        &self,
        conversation_id: i32,
        before: Option<DateTime<Utc>>,
        limit: Option<i32>,
    ) -> Result<Vec<Attachment>, DBError> {
        let stm = include_str!("./queries/attachment/get_attachments_by_conversation_id.sql");

        let result = sqlx::query_as(stm)
            .bind(conversation_id)
            .bind(before)
            .bind(limit)
            .fetch_all(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Fetching media files error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn delete_attachment_by_message_id(&self, message_id: i64) -> Result<u64, DBError> {
        let stm = include_str!("./queries/attachment/delete_attachment_by_message_id.sql");

        let result = sqlx::query(stm)
            .bind(message_id)
            .execute(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Delete attachment error: {e}");
                DBError::QueryError(e)
            })?;

        if result.rows_affected() == 0 {
            log::error!("Delete attachment returns 0 rows affected");
            Err(DBError::QueryFailed("0 rows affected".to_string()))
        } else {
            Ok(result.rows_affected())
        }
    }
}
