use actix_multipart::form::tempfile::TempFileConfig;
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use communication_service::{
    app::AppState,
    controllers::{
        attachment_controller::AttachmentController,
        conversation_controller::ConversationController, message_controller::MessageController,
        user_controller::UserController, ws_controller::WSController,
    },
    grpc::grpc_service::GrpcCommunicationService,
    openapi::ApiDoc,
};
use dotenvy::dotenv;
use env_logger::Env;
use farmera_grpc_proto::communication::communication_service_server::CommunicationServiceServer;
use std::env;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

async fn health_check() -> impl Responder {
    HttpResponse::Ok().body("OK")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let server_addr = env::var("SERVER_ADDRESS").unwrap_or_else(|_| "127.0.0.1".to_string());
    let server_port = env::var("SERVER_PORT").unwrap_or_else(|_| "3005".to_string());

    // create upload directory
    std::fs::create_dir_all("./uploads/tmp")?;
    log::info!("Temporary upload directory created");

    let state = AppState::build().await;

    let app_data = web::Data::new(state.app_services.clone());
    let chat_server_handler = web::Data::new(state.chat_server_handler);

    // start chat server
    let chat_server = tokio::spawn(state.app_processors.chat_server.run());

    // create the gRPC communication service instance
    let grpc_communication_service = GrpcCommunicationService::new(state.app_services.clone());

    // start grpc server
    tokio::spawn(async move {
        // Set up the gRPC server address and port from environment variables
        let grpc_server_addr =
            env::var("GRPC_SERVER_ADDRESS").unwrap_or_else(|_| "127.0.0.1".to_string());
        let grpc_server_port = env::var("GRPC_PORT").unwrap_or_else(|_| "50055".to_string());

        let grpc_addr = format!("{}:{}", grpc_server_addr, grpc_server_port)
            .parse()
            .expect("Invalid address format");

        log::info!("gRPC server listening on {}", grpc_addr);

        tonic::transport::Server::builder()
            .add_service(CommunicationServiceServer::new(grpc_communication_service))
            .serve_with_shutdown(grpc_addr, async {
                tokio::signal::ctrl_c()
                    .await
                    .expect("Failed to listen for ctrl_c");
                log::info!("Shutting down grpc server gracefully...");
            })
            .await
            .unwrap();
    });

    // start http server
    let http_server = HttpServer::new(move || {
        App::new()
            // server states
            .app_data(app_data.clone())
            .app_data(chat_server_handler.clone())
            // health check
            .route("/health", web::get().to(health_check))
            //
            .app_data(TempFileConfig::default().directory("./uploads/tmp"))
            // route configurations
            // websocket
            .configure(WSController::routes)
            // apis
            .service(
                web::scope("/api")
                    .configure(ConversationController::routes)
                    .configure(MessageController::routes)
                    .configure(AttachmentController::routes)
                    .configure(UserController::routes),
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

    tokio::try_join!(http_server, async move { chat_server.await.unwrap() })?;

    Ok(())
}
