use std::{error, sync::Arc};

use uuid::Uuid;

use crate::redis_repositories::user_redis_repo::UserRedisRepo;

pub struct UserService {
    user_redis_repo: Arc<UserRedisRepo>,
}

impl UserService {
    pub fn new(user_redis_repo: Arc<UserRedisRepo>) -> Self {
        Self { user_redis_repo }
    }

    pub async fn check_online_user(&self, user_id: Uuid) -> Result<bool, Box<dyn error::Error>> {
        self.user_redis_repo.is_user_online(user_id).await
    }
}
