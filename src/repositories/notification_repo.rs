use std::sync::Arc;

use sqlx::PgPool;

use crate::{
    errors::db_error::DBError,
    models::notification::{NewNotification, Notification},
};

pub struct NotificationRepo {
    pub pg_pool: Arc<PgPool>,
}

impl NotificationRepo {
    pub fn new(pg_pool: Arc<PgPool>) -> Self {
        Self { pg_pool }
    }

    pub async fn insert_notification(
        &self,
        notification: &NewNotification,
    ) -> Result<i64, DBError> {
        let stm = include_str!("./queries/notification/insert_notification.sql");

        let result = sqlx::query_scalar(stm)
            .bind(&notification.template_id)
            .bind(&notification.title)
            .bind(&notification.content)
            .bind(&notification.channel)
            .fetch_one(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Insert notification error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn get_notifications(
        &self,
        order: &str,
        limit: i32,
        asc: bool,
    ) -> Result<Vec<Notification>, DBError> {
        let stm = include_str!("./queries/notification/get_notifications.sql");
        let valid_columns = ["notification_id", "title", "channel", "created", "updated"].to_vec();
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
                log::error!("Fetching notification error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }
}
