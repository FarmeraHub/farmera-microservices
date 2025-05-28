use std::env;

use actix_web::{App, HttpServer, web};
use dotenvy::dotenv;
use env_logger::Env;
use farmera_grpc_proto::notification::notification_service_server::NotificationServiceServer;
use grpc::grpc_service::GrpcNotificationService;
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

mod grpc;

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

    // Set up the server address and port from environment variables
    let server_addr = env::var("SERVER_ADDRESS").unwrap_or_else(|_| "127.0.0.1".to_string());
    let server_port = env::var("SERVER_PORT").unwrap_or_else(|_| "3004".to_string());

    let app_data = web::Data::new(state.services.clone());

    // Create the gRPC notification service instance
    let grpc_notification_service = GrpcNotificationService::new(state.services.clone());

    tokio::spawn(async move {
        // Set up the gRPC server address and port from environment variables
        let grpc_server_addr =
            env::var("GRPC_SERVER_ADDRESS").unwrap_or_else(|_| "127.0.0.1".to_string());
        let grpc_server_port = env::var("GRPC_PORT").unwrap_or_else(|_| "50054".to_string());

        let grpc_addr = format!("{}:{}", grpc_server_addr, grpc_server_port)
            .parse()
            .expect("Invalid address format");

        log::info!("gRPC server listening on {}", grpc_addr);

        tonic::transport::Server::builder()
            .add_service(NotificationServiceServer::new(grpc_notification_service))
            .serve_with_shutdown(grpc_addr, async {
                tokio::signal::ctrl_c()
                    .await
                    .expect("Failed to listen for ctrl_c");
                log::info!("Shutting down grpc server gracefully...");
            })
            .await
            .unwrap();
    });

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
