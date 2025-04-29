use std::env;

use deadpool_redis::Runtime;

pub fn create_redis_pool() -> deadpool_redis::Pool {
    let redis_url = env::var("REDIS_URL").expect("REDIS_URL must be set");

    deadpool_redis::Config::from_url(redis_url)
        .create_pool(Some(Runtime::Tokio1))
        .expect("Cannot create redis pool")
}
