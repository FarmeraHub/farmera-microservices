use std::{env, sync::Arc};

use actix_web::{App, HttpServer, web};
use config::{
    kafka::{create_consumer, create_topic},
    pg_db::create_pg_pool,
};
use dotenvy::dotenv;
use env_logger::Env;
use sqlx::migrate;
use workers::{
    email_processor::EmailProcessor, processor_trait::Processor, push_processor::PushProcessor,
};

mod config;
mod dispatchers;
mod errors;
mod models;
mod repositories;
mod services;
mod utils;
mod workers;

async fn index() -> &'static str {
    "Hello world"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    env_logger::init_from_env(Env::default().default_filter_or("info"));

    // init database pool
    let pg_pool = Arc::new(create_pg_pool().await);
    log::info!("PostgreSQL pool created");

    // run migration
    let migrator = migrate::Migrator::new(std::path::Path::new("./migrations"))
        .await
        .expect("Migrator creation failed");

    migrator.run(&*pg_pool).await.expect("Migration failed");
    log::info!("Migration success");

    let server_addr = env::var("SERVER_ADDRESS").expect("SERVER_ADDRESS must be set");
    let server_port = env::var("SERVER_PORT").expect("SERVER_PORT must be set");

    // init consumers
    let brokers = env::var("BROKERS").expect("BROKER must be set");
    create_topic(&brokers, "push", 1, 1).await;
    create_topic(&brokers, "email", 1, 1).await;
    let push_consumer = create_consumer(&brokers, "push-group", &["push"]);
    let email_consumer = create_consumer(&brokers, "email-group", &["email"]);

    // init processors
    let push_processor = PushProcessor::new(push_consumer);
    let email_processor = EmailProcessor::new(email_consumer);

    // start processors
    tokio::spawn(push_processor.run());
    tokio::spawn(email_processor.run());

    // start server
    HttpServer::new(|| App::new().route("/", web::get().to(index)))
        .bind(format!("{server_addr}:{server_port}"))?
        .workers(1)
        .run()
        .await
}
