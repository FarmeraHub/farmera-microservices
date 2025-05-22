use std::sync::Arc;

use uuid::Uuid;

use crate::{
    errors::db_error::DBError,
    models::user_preferences::{NewUserPreferences, UserPreferences},
    repositories::user_preferences_repo::UserPreferencesRepo,
};

pub struct UserPreferencesService {
    user_preferences_repo: Arc<UserPreferencesRepo>,
}

impl UserPreferencesService {
    pub fn new(user_preferences_repo: Arc<UserPreferencesRepo>) -> Self {
        Self {
            user_preferences_repo,
        }
    }

    pub async fn create_user_preferences(
        &self,
        preferences: &NewUserPreferences,
    ) -> Result<UserPreferences, DBError> {
        self.user_preferences_repo
            .insert_user_preferences(preferences)
            .await
    }

    pub async fn get_user_preferences_by_user_id(
        &self,
        user_id: Uuid,
    ) -> Result<UserPreferences, DBError> {
        self.user_preferences_repo
            .get_user_preferences_by_user_id(user_id)
            .await
    }

    pub async fn update_user_preferences(
        &self,
        preferences: &NewUserPreferences,
    ) -> Result<UserPreferences, DBError> {
        self.user_preferences_repo
            .update_user_preferences(preferences)
            .await
    }
}
