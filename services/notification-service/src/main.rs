use std::env;

use actix_web::{App, HttpServer, web};
use dotenvy::dotenv;
use env_logger::Env;
use notification_service::{
    app::AppState,
    controllers::{
        notification_controller::NotificationController, send_controller::SendController,
        template_controller::TemplateController, user_device_controller::UserDeviceController,
        user_preferences_controller::UserPreferencesController, webhook::Webhook,
    },
    openapi::ApiDoc,
};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

async fn index() -> &'static str {
    "Hello world"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let state = AppState::build().await;

    // tokio::time::sleep(std::time::Duration::from_secs(10)).await;

    // start processors
    tokio::spawn(state.processors.push_processor_1.run());
    tokio::spawn(state.processors.email_processor_1.run());

    let server_addr = env::var("SERVER_ADDRESS").unwrap_or_else(|_| "127.0.0.1".to_string());
    let server_port = env::var("SERVER_PORT").unwrap_or_else(|_| "3004".to_string());

    let app_data = web::Data::new(state.services);

    // start server
    HttpServer::new(move || {
        App::new()
            .route("/", web::get().to(index))
            // app states
            .app_data(app_data.clone())
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
