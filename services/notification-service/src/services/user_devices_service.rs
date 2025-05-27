use std::sync::Arc;

use uuid::Uuid;

use crate::{
    errors::db_error::DBError, models::user_preferences::UserDeviceToken,
    repositories::user_device_token_repo::UserDeviceTokenRepo,
};

pub struct UserDeviceService {
    user_device_token_repo: Arc<UserDeviceTokenRepo>,
}

impl UserDeviceService {
    pub fn new(user_device_token_repo: Arc<UserDeviceTokenRepo>) -> Self {
        Self {
            user_device_token_repo,
        }
    }

    pub async fn create_user_device_token(
        &self,
        user_device_token: &UserDeviceToken,
    ) -> Result<UserDeviceToken, DBError> {
        self.user_device_token_repo
            .insert_user_device_token(user_device_token)
            .await
    }

    pub async fn get_user_device_token(&self, user_id: Uuid) -> Result<Vec<String>, DBError> {
        self.user_device_token_repo
            .get_device_token_by_user_id(user_id)
            .await
    }

    pub async fn delete_user_device_token(&self, token: &str) -> Result<u64, DBError> {
        self.user_device_token_repo.delete_device_token(token).await
    }
}
