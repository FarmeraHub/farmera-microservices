use std::sync::Arc;

use sqlx::PgPool;
use uuid::Uuid;

use crate::{errors::db_error::DBError, models::user_preferences::UserDeviceToken};

pub struct UserDeviceTokenRepo {
    pg_pool: Arc<PgPool>,
}

impl UserDeviceTokenRepo {
    pub fn new(pg_pool: Arc<PgPool>) -> Self {
        Self { pg_pool }
    }

    pub async fn insert_user_device_token(
        &self,
        user_token: &UserDeviceToken,
    ) -> Result<UserDeviceToken, DBError> {
        let stm = include_str!("./queries/user_device_token/insert_device_token.sql");

        let result: UserDeviceToken = sqlx::query_as(stm)
            .bind(&user_token.user_id)
            .bind(&user_token.token)
            .fetch_one(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Insert user token error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn get_device_token_by_user_id(&self, user_id: Uuid) -> Result<Vec<String>, DBError> {
        let stm = include_str!("./queries/user_device_token/get_device_by_user_id.sql");

        let result = sqlx::query_as::<_, (String,)>(stm)
            .bind(user_id)
            .fetch_all(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Get user token error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result.into_iter().map(|value| value.0).collect())
    }

    pub async fn delete_device_token(&self, token: &str) -> Result<u64, DBError> {
        let stm = include_str!("./queries/user_device_token/delete_device.sql");

        let result = sqlx::query(stm)
            .bind(token)
            .execute(&*self.pg_pool)
            .await
            .map_err(|e| DBError::QueryError(e))?;

        if result.rows_affected() == 0 {
            log::error!("Delete user device token returns 0 rows affected");
            Err(DBError::QueryFailed("0 row affected".to_string()))
        } else {
            Ok(result.rows_affected())
        }
    }
}
