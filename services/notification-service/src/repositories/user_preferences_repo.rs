use std::sync::Arc;

use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::db_error::DBError,
    models::user_preferences::{NewUserPreferences, UserPreferences},
};

pub struct UserPreferencesRepo {
    pg_pool: Arc<PgPool>,
}

impl UserPreferencesRepo {
    pub fn new(pg_pool: Arc<PgPool>) -> Self {
        Self { pg_pool }
    }

    pub async fn insert_user_preferences(
        &self,
        preferences: &NewUserPreferences,
    ) -> Result<UserPreferences, DBError> {
        let stm = include_str!("./queries/user_preferences/insert_user_preference.sql");

        let result = sqlx::query_as(stm)
            .bind(&preferences.user_id)
            .bind(&preferences.user_email)
            .bind(&preferences.transactional_channels)
            .bind(&preferences.system_alert_channels)
            .bind(&preferences.chat_channels)
            .bind(&preferences.do_not_disturb_start)
            .bind(&preferences.do_not_disturb_end)
            .bind(&preferences.time_zone)
            .fetch_one(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Insert user preferences error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn get_user_preferences_by_user_id(
        &self,
        user_id: Uuid,
    ) -> Result<Option<UserPreferences>, DBError> {
        let stm = include_str!("./queries/user_preferences/get_user_preferences_by_user_id.sql");

        let result = sqlx::query_as(stm)
            .bind(user_id)
            .fetch_optional(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Get user preferences error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }

    pub async fn update_user_preferences(
        &self,
        preferences: &NewUserPreferences,
    ) -> Result<UserPreferences, DBError> {
        let stm = include_str!("./queries/user_preferences/update_user_preferences.sql");

        let result = sqlx::query_as(stm)
            .bind(&preferences.user_id)
            .bind(&preferences.user_email)
            .bind(&preferences.transactional_channels)
            .bind(&preferences.system_alert_channels)
            .bind(&preferences.chat_channels)
            .bind(&preferences.do_not_disturb_start)
            .bind(&preferences.do_not_disturb_end)
            .bind(&preferences.time_zone)
            .fetch_one(&*self.pg_pool)
            .await
            .map_err(|e| {
                log::error!("Insert user preferences error: {e}");
                DBError::QueryError(e)
            })?;

        Ok(result)
    }
}
