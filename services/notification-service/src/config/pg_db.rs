use std::env;

use sqlx::{postgres::PgPoolOptions, PgPool};

pub async fn create_pg_pool() -> PgPool {
    let database_url = env::var("PG_DATABASE_URL").expect("PG_DATABASE_URL must be set");

    PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await
        .expect("Database pool create failed")
}
