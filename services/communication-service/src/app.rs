use std::{env, sync::Arc};

use sqlx::migrate;

use crate::{
    config::{pg_db::create_pg_pool, redis::create_redis_pool},
    grpc::noti_client::NotificationGrpcClient,
    repositories::{
        attachment_repo::AttachmentRepo, conversation_repo::ConversationRepo,
        message_repo::MessageRepo,
    },
    services::{
        attachment_service::AttachmentService, convesation_service::ConversationService,
        message_service::MessageService,
    },
    ws::{chat_server::ChatServer, chat_server_handler::ChatServerHandler},
};

pub struct AppState {
    pub app_services: AppServices,
    pub app_processors: AppProcessors,
    pub chat_server_handler: ChatServerHandler,
}

#[derive(Clone)]
pub struct AppServices {
    pub attachment_service: Arc<AttachmentService>,
    pub conversation_service: Arc<ConversationService>,
    pub messages_service: Arc<MessageService>,
}

pub struct AppProcessors {
    pub chat_server: ChatServer,
}

impl AppState {
    pub async fn build() -> Self {
        // init redis pool
        let redis_pool = Arc::new(create_redis_pool());
        log::info!("Redis Pool created");

        // init postgres pool
        let pg_pool = Arc::new(create_pg_pool().await);
        log::info!("Pg Pool created");

        // run migration
        let migrator = migrate::Migrator::new(std::path::Path::new("./migrations"))
            .await
            .expect("Migrator create failed");
        migrator.run(&*pg_pool).await.expect("Migration failed");
        log::info!("Migration success");

        // init notification service grpc client
        let noti_srv_grpc_server_addr = env::var("NOTIFICATION_SERVICE_GRPC_ADDRESS")
            .unwrap_or_else(|_| "http://127.0.0.1".to_string());
        let noti_srv_grpc_server_port =
            env::var("NOTIFICATION_SERVICE_GRPC_PORT").unwrap_or_else(|_| "50054".to_string());

        let noti_grpc_server_addr = format!(
            "{}:{}",
            noti_srv_grpc_server_addr, noti_srv_grpc_server_port
        );

        let notification_service_client =
            NotificationGrpcClient::connect(noti_grpc_server_addr).await;

        // init repositories
        let conversation_repository = Arc::new(ConversationRepo::new(pg_pool.clone()));
        let message_repository = Arc::new(MessageRepo::new(pg_pool.clone()));
        let attachment_repository = Arc::new(AttachmentRepo::new(pg_pool.clone()));

        // init services
        let conversation_service =
            Arc::new(ConversationService::new(conversation_repository.clone()));
        let messages_service = Arc::new(MessageService::new(
            message_repository.clone(),
            attachment_repository.clone(),
        ));
        let attachment_service = Arc::new(AttachmentService::new(
            attachment_repository.clone(),
            message_repository.clone(),
        ));

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
            notification_service_client.clone(),
        )
        .await;

        let app_services = AppServices {
            attachment_service,
            conversation_service,
            messages_service,
        };

        let app_processors = AppProcessors { chat_server };

        AppState {
            app_services,
            app_processors,
            chat_server_handler,
        }
    }
}
