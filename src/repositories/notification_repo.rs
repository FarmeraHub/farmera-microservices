use std::sync::Arc;

use chrono::{DateTime, Utc};
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

    pub async fn insert_user_notification(
        &self,
        recipient: &str,
        notification_id: i64,
        status: &str,
        delivered_at: Option<DateTime<Utc>>,
    ) -> Result<i64, DBError> {
        let stm = include_str!("./queries/user_notification/insert_user_notification.sql");

        let result = sqlx::query_scalar(stm)
            .bind(recipient)
            .bind(notification_id)
            .bind(status)
            .bind(delivered_at)
            .fetch_one(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Insert user notification error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn update_user_notification_status(
        &self,
        id: i64,
        status: &str,
        delivered_at: Option<DateTime<Utc>>,
    ) -> Result<u64, DBError> {
        let stm = include_str!("./queries/user_notification/update_status.sql");

        let result = sqlx::query(stm)
            .bind(id)
            .bind(status)
            .bind(delivered_at)
            .execute(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Update user notification status error: {e}");
                DBError::QueryError(e)
            })?;

        if result.rows_affected() == 0 {
            log::error!("Update user notification status returns 0 rows affected");
            Err(DBError::QueryFailed("0 rows affected".to_string()))
        } else {
            Ok(result.rows_affected())
        }
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
