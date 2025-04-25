use std::{env, sync::Arc};

use actix_files::NamedFile;
use actix_multipart::form::tempfile::TempFileConfig;
use actix_web::{web, App, HttpServer, Responder};
use config::{pg_db::create_pg_pool, redis::create_redis_pool};
use controllers::{
    attachment_controller::AttachmentController, conversation_controller::ConversationController,
    message_controller::MessageController, ws_controller,
};
use dotenvy::dotenv;
use env_logger::Env;
use openapi::ApiDoc;
use repositories::{
    attachment_repo::AttachmentRepo, conversation_repo::ConversationRepo, message_repo::MessageRepo,
};
use services::{
    attachment_service::AttachmentService, convesation_service::ConversationService,
    message_service::MessageService,
};
use sqlx::migrate;
use tokio::{spawn, try_join};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use ws::chat_server::ChatServer;

mod config;
mod controllers;
mod docs;
mod errors;
mod models;
mod openapi;
mod repositories;
mod services;
mod ws;

async fn index() -> impl Responder {
    NamedFile::open_async("./static/index.html").await.unwrap()
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let server_addr = env::var("SERVER_ADDRESS").expect("SERVER_ADDRESS must be set");
    let server_port = env::var("SERVER_PORT").expect("SERVER_PORT must be set");

    // create upload directory
    std::fs::create_dir_all("./uploads/tmp")?;
    log::info!("Temporary upload directory created");

    // init redis pool
    let redis_pool = Arc::new(create_redis_pool());

    // init postgres pool
    let pg_pool = Arc::new(create_pg_pool().await);
    log::info!("Pg Pool created");

    // run migration
    let migrator = migrate::Migrator::new(std::path::Path::new("./migrations"))
        .await
        .expect("Migrator create failed");
    migrator.run(&*pg_pool).await.expect("Migration failed");
    log::info!("Migration success");

    // init repositories
    let conversation_repository = Arc::new(ConversationRepo::new(pg_pool.clone()));
    let message_repository = Arc::new(MessageRepo::new(pg_pool.clone()));
    let attachment_repository = Arc::new(AttachmentRepo::new(pg_pool.clone()));

    // init services
    let conversation_service = Arc::new(ConversationService::new(conversation_repository.clone()));
    let message_service = Arc::new(MessageService::new(message_repository.clone()));
    let attachment_service = Arc::new(AttachmentService::new(
        attachment_repository.clone(),
        message_repository.clone(),
    ));

    // init controller
    let conversation_controller =
        Arc::new(ConversationController::new(conversation_service.clone()));
    let message_controller = Arc::new(MessageController::new(message_service.clone()));
    let attachment_controller = Arc::new(AttachmentController::new(attachment_service.clone()));

    // init redis client
    let redis_client = Arc::new(
        redis::Client::open(env::var("REDIS_URL").expect("REDIS_URL must be set")).unwrap(),
    );

    // init chat server
    let (chat_server, chat_server_handler) = ChatServer::new(
        redis_pool.clone(),
        redis_client.clone(),
        conversation_repository.clone(),
        message_repository.clone(),
    )
    .await;
    // start chat server
    let chat_server = spawn(chat_server.run());

    let http_server = HttpServer::new(move || {
        App::new()
            // server states
            .app_data(web::Data::new(chat_server_handler.clone()))
            .app_data(web::Data::new(conversation_controller.clone()))
            .app_data(web::Data::new(message_controller.clone()))
            .app_data(web::Data::new(attachment_controller.clone()))
            //
            .app_data(TempFileConfig::default().directory("./uploads/tmp"))
            .service(web::resource("/").to(index))
            // route configurations
            // websocket
            .configure(ws_controller::WSController::routes)
            // apis
            .service(
                web::scope("/api")
                    .configure(controllers::conversation_controller::ConversationController::routes)
                    .configure(controllers::message_controller::MessageController::routes)
                    .configure(controllers::attachment_controller::AttachmentController::routes),
            )
            // swagger
            .service(
                SwaggerUi::new("/swagger-ui/{_:.*}")
                    .url("/api-doc/openapi.json", ApiDoc::openapi()),
            )
    })
    .bind(format!("{server_addr}:{server_port}"))?
    .workers(3)
    .run();

    try_join!(http_server, async move { chat_server.await.unwrap() })?;

    Ok(())
}
