use std::sync::Arc;

use chrono::{DateTime, Utc};
use sqlx::PgPool;

use crate::errors::db_error::DBError;

pub struct UserNotificationsRepo {
    pg_pool: Arc<PgPool>,
}

impl UserNotificationsRepo {
    pub fn new(pg_pool: Arc<PgPool>) -> Self {
        Self { pg_pool }
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
        let stm = include_str!("./queries/user_notification/update_status_by_id.sql");

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

    pub async fn update_status_by_recipient_and_noti_id(
        &self,
        recipient: &str,
        notification_id: i64,
        status: &str,
        delivered_at: Option<DateTime<Utc>>,
    ) -> Result<u64, DBError> {
        let stm =
            include_str!("./queries/user_notification/update_status_by_recipient_and_noti_id.sql");

        let result = sqlx::query(stm)
            .bind(recipient)
            .bind(notification_id)
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
}
