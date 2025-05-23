use std::{collections::HashSet, sync::Arc};

use uuid::Uuid;

use crate::{
    errors::db_error::DBError,
    models::{
        Channel,
        user_preferences::{NewUserPreferences, UserPreferences},
    },
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
        preferences: &mut NewUserPreferences,
    ) -> Result<UserPreferences, DBError> {
        // Remove duplicates from the channels
        preferences.transactional_channels = preferences
            .transactional_channels
            .clone()
            .into_iter()
            .collect::<HashSet<Channel>>()
            .into_iter()
            .collect::<Vec<Channel>>();

        preferences.system_alert_channels = preferences
            .system_alert_channels
            .clone()
            .into_iter()
            .collect::<HashSet<Channel>>()
            .into_iter()
            .collect::<Vec<Channel>>();

        preferences.chat_channels = preferences
            .chat_channels
            .clone()
            .into_iter()
            .collect::<HashSet<Channel>>()
            .into_iter()
            .collect::<Vec<Channel>>();

        self.user_preferences_repo
            .insert_user_preferences(preferences)
            .await
    }

    pub async fn get_user_preferences_by_user_id(
        &self,
        user_id: Uuid,
    ) -> Result<Option<UserPreferences>, DBError> {
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
