use std::{env, sync::Arc};

use actix::Actor;
use actix_web::{App, HttpServer, web};
use config::{
    kafka::{create_consumer, create_producer, create_topic},
    pg_db::create_pg_pool,
};
use controllers::{
    notification_controller::NotificationController, send_controller::SendController,
    template_controller::TemplateController, user_device_controller::UserDeviceController,
    user_preferences_controller::UserPreferencesController, webhook::Webhook,
};
use dispatchers::{
    dispatcher_actor::DispatcherActor, email_dispatcher::EmailDispatcher,
    push_dispatcher::PushDispatcher,
};
use dotenvy::dotenv;
use env_logger::Env;
use middlewares::{auth_middleware::AuthMiddleware, rbac_middleware::RBACMiddleware};
use openapi::ApiDoc;
use processor::actor_processor::ActorProcessor;
use repositories::{
    notification_repo::NotificationRepo, template_repo::TemplateRepo,
    user_device_token_repo::UserDeviceTokenRepo, user_notification_repo::UserNotificationsRepo,
    user_preferences_repo::UserPreferencesRepo,
};
use services::{
    email_service::EmailService, notification_service::NotificationService,
    push_service::PushService, send_service::SendService, template_service::TemplateService,
    user_devices_service::UserDeviceService, user_preferences_service::UserPreferencesService,
};
use sqlx::migrate;
use utils::fcm_token_manager::TokenManager;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

mod config;
mod controllers;
mod dispatchers;
mod docs;
mod errors;
mod middlewares;
mod models;
mod openapi;
mod processor;
mod repositories;
mod services;
mod types;
mod utils;

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

    // init topics
    let brokers = env::var("BROKERS").expect("BROKER must be set");

    // wait_for_kafka_ready(&brokers).await;

    create_topic(&brokers, "push", 1, 1).await;
    create_topic(&brokers, "email", 1, 1).await;

    // producer to put message back to queue if sending fails
    let push_producer = Arc::new(create_producer(&brokers));
    let email_producer = Arc::new(create_producer(&brokers));

    // init consumsers
    let push_consumer_1 = create_consumer(&brokers, "push-group", &["push"]);
    let email_consumer_1 = create_consumer(&brokers, "email-group", &["email"]);

    // init repositories
    let notification_repo = Arc::new(NotificationRepo::new(pg_pool.clone()));
    let template_repo = Arc::new(TemplateRepo::new(pg_pool.clone()));
    let user_notification_repo = Arc::new(UserNotificationsRepo::new(pg_pool.clone()));
    let user_device_token_repo = Arc::new(UserDeviceTokenRepo::new(pg_pool.clone()));
    let user_preferences_repo = Arc::new(UserPreferencesRepo::new(pg_pool.clone()));

    // init services
    let notification_service = Arc::new(NotificationService::new(
        notification_repo.clone(),
        template_repo.clone(),
    ));
    let template_service = Arc::new(TemplateService::new(template_repo.clone()));
    let email_service = Arc::new(EmailService::new(
        email_producer.clone(),
        user_notification_repo.clone(),
    ));
    let push_service = Arc::new(PushService::new(push_producer.clone()));
    let user_preferences_service =
        Arc::new(UserPreferencesService::new(user_preferences_repo.clone()));
    let user_devices_service = Arc::new(UserDeviceService::new(user_device_token_repo.clone()));

    let send_service = Arc::new(SendService::new(
        user_preferences_service.clone(),
        user_devices_service.clone(),
        email_service.clone(),
        push_service.clone(),
    ));

    // init controllers
    let notification_controller =
        Arc::new(NotificationController::new(notification_service.clone()));
    let template_controller = Arc::new(TemplateController::new(template_service.clone()));
    let send_controller = Arc::new(SendController::new(send_service.clone()));
    let user_preferences_controller = Arc::new(UserPreferencesController::new(
        user_preferences_service.clone(),
    ));
    let user_devices_controller = Arc::new(UserDeviceController::new(user_devices_service.clone()));

    let webhook = Arc::new(Webhook::new(email_service.clone()));

    let token_manager = Arc::new(TokenManager::new().await);

    // init processors
    let push_dispatcher_1 = DispatcherActor::new(Arc::new(
        PushDispatcher::new(
            token_manager,
            notification_repo.clone(),
            user_notification_repo.clone(),
            template_repo.clone(),
            push_producer.clone(),
        )
        .await,
    ));
    let push_processor_1 =
        ActorProcessor::new(push_consumer_1, push_dispatcher_1.start().recipient());

    let email_dispatcher_1 = DispatcherActor::new(Arc::new(EmailDispatcher::new(
        notification_repo.clone(),
        user_notification_repo.clone(),
        template_repo.clone(),
        email_producer.clone(),
    )));
    let email_processor_1 =
        ActorProcessor::new(email_consumer_1, email_dispatcher_1.start().recipient());

    // tokio::time::sleep(std::time::Duration::from_secs(10)).await;

    // start processors
    tokio::spawn(push_processor_1.run());
    tokio::spawn(email_processor_1.run());

    // start server
    HttpServer::new(move || {
        App::new()
            .route("/", web::get().to(index))
            // app states
            .app_data(web::Data::new(template_controller.clone()))
            .app_data(web::Data::new(notification_controller.clone()))
            .app_data(web::Data::new(send_controller.clone()))
            .app_data(web::Data::new(user_preferences_controller.clone()))
            .app_data(web::Data::new(user_devices_controller.clone()))
            .app_data(web::Data::new(webhook.clone()))
            // route configurations
            .service(
                web::scope("/api")
                    .configure(TemplateController::routes)
                    .configure(NotificationController::routes)
                    .configure(SendController::routes)
                    .service(
                        web::scope("/user")
                            .configure(UserPreferencesController::routes)
                            .configure(UserDeviceController::routes),
                    )
                    .configure(Webhook::routes), // .wrap(RBACMiddleware)
                                                 // .wrap(AuthMiddleware),
            )
            // swagger-ui
            .service(
                SwaggerUi::new("/swagger-ui/{_:.*}")
                    .url("/api-doc/openapi.json", ApiDoc::openapi()),
            )
    })
    .bind(format!("{server_addr}:{server_port}"))?
    .workers(3)
    .run()
    .await
}
