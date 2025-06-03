use std::env;

use dotenvy::dotenv;
use env_logger::Env;
use farmera_grpc_proto::notification::notification_service_server::NotificationServiceServer;
use grpc::grpc_service::GrpcNotificationService;
use notification_service::app::AppState;

mod grpc;

#[actix_web::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    env_logger::init_from_env(Env::default().default_filter_or("info"));

    // Initialize application state
    let state = AppState::build().await;

    // Set up the gRPC server address and port from environment variables
    let server_addr = env::var("GRPC_SERVER_ADDRESS").unwrap_or_else(|_| "127.0.0.1".to_string());
    let server_port = env::var("GRPC_PORT").unwrap_or_else(|_| "50054".to_string());

    let addr = format!("{}:{}", server_addr, server_port)
        .parse()
        .expect("Invalid address format");

    // start processors
    tokio::spawn(state.processors.push_processor_1.run());
    tokio::spawn(state.processors.email_processor_1.run());

    // Create the gRPC notification service instance
    let grpc_notification_service = GrpcNotificationService::new(state.services);

    log::info!("gRPC server listening on {}", addr);

    tonic::transport::Server::builder()
        .add_service(NotificationServiceServer::new(grpc_notification_service))
        .serve_with_shutdown(addr, async {
            tokio::signal::ctrl_c()
                .await
                .expect("Failed to listen for ctrl_c");
            log::info!("Shutting down server gracefully...");
        })
        .await?;

    Ok(())
}
