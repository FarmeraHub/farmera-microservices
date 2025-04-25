use std::sync::Arc;

use sqlx::PgPool;

use crate::{errors::db_error::DBError, models::attachment::MediaContent};

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
        media_content: MediaContent,
    ) -> Result<i32, DBError> {
        let stm = include_str!("./queries/attachment/insert_attachment.sql");

        let attachment_id = sqlx::query_scalar(stm)
            .bind(message_id)
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

    pub async fn _update_attachment_message_id(
        &self,
        message_id: i64,
        attachment_id: i32,
    ) -> Result<u64, DBError> {
        let stm = include_str!("./queries/attachment/update_message_id.sql");

        let result = sqlx::query(stm)
            .bind(message_id)
            .bind(attachment_id)
            .execute(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Update attachment error: {e}");
                DBError::QueryError(e)
            })?;

        if result.rows_affected() == 0 {
            log::error!("Delete user_conversation returns 0 rows affected");
            Err(DBError::QueryFailed("0 rows affected".to_string()))
        } else {
            Ok(result.rows_affected())
        }
    }

    pub async fn bulk_insert_attachments(
        &self,
        message_id: Option<i64>,
        media_contents: &Vec<MediaContent>,
    ) -> Result<Vec<i32>, DBError> {
        if media_contents.is_empty() {
            return Ok(vec![]);
        }

        let mut query = String::from(
            "INSERT INTO attachments (message_id, file_url, file_size, file_type) VALUES ",
        );
        let mut params: Vec<String> = vec![];
        let mut msg_id = vec![];
        let mut urls = vec![];
        let mut sizes = vec![];
        let mut types = vec![];

        for (i, media) in media_contents.iter().enumerate() {
            let base = i * 4;
            params.push(format!(
                "(${}, ${}, ${}, ${})",
                base + 1,
                base + 2,
                base + 3,
                base + 4
            ));

            msg_id.push(message_id);
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
}
