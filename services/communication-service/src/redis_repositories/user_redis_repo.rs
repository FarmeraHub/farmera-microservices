use std::{error, sync::Arc};

use deadpool_redis::Pool;
use redis::AsyncCommands;
use uuid::Uuid;

pub struct UserRedisRepo {
    redis_pool: Arc<Pool>,
}

impl UserRedisRepo {
    pub fn new(redis_pool: Arc<Pool>) -> Self {
        Self { redis_pool }
    }

    pub async fn get_online_users(&self) -> Result<Vec<String>, Box<dyn error::Error>> {
        let mut redis_conn = self.redis_pool.get().await?;
        let online_users: Vec<String> = redis_conn.smembers("online_users").await?;
        Ok(online_users)
    }

    pub async fn is_user_online(&self, user_id: Uuid) -> Result<bool, Box<dyn error::Error>> {
        let mut redis_conn = self.redis_pool.get().await?;

        let is_online: bool = redis_conn
            .sismember("online_users", user_id.to_string())
            .await?;

        Ok(is_online)
    }
}
