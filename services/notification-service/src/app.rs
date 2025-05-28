use std::{env, sync::Arc};

use actix::Actor;
use sqlx::migrate;

use crate::{
    config::{
        kafka::{create_consumer, create_producer, create_topic},
        pg_db::create_pg_pool,
    },
    dispatchers::{
        dispatcher_actor::DispatcherActor, email_dispatcher::EmailDispatcher,
        push_dispatcher::PushDispatcher,
    },
    processor::actor_processor::ActorProcessor,
    repositories::{
        notification_repo::NotificationRepo, template_repo::TemplateRepo,
        user_device_token_repo::UserDeviceTokenRepo, user_notification_repo::UserNotificationsRepo,
        user_preferences_repo::UserPreferencesRepo,
    },
    services::{
        email_service::EmailService, notification_service::NotificationService,
        push_service::PushService, send_service::SendService, template_service::TemplateService,
        user_devices_service::UserDeviceService, user_preferences_service::UserPreferencesService,
    },
    utils::fcm_token_manager::TokenManager,
};

pub struct AppState {
    pub services: AppServices,
    pub processors: AppProcessors,
}

#[derive(Clone)]
pub struct AppServices {
    pub notification_service: Arc<NotificationService>,
    pub template_service: Arc<TemplateService>,
    pub send_service: Arc<SendService>,
    pub user_preferences_service: Arc<UserPreferencesService>,
    pub user_devices_service: Arc<UserDeviceService>,
}

pub struct AppProcessors {
    pub push_processor_1: ActorProcessor,
    pub email_processor_1: ActorProcessor,
}

impl AppState {
    /// Builds the application state, initializing all necessary components.
    pub async fn build() -> Self {
        // init database pool
        let pg_pool = Arc::new(create_pg_pool().await);
        log::info!("PostgreSQL pool created");

        // run migration
        let migrator = migrate::Migrator::new(std::path::Path::new("./migrations"))
            .await
            .expect("Migrator creation failed");

        migrator.run(&*pg_pool).await.expect("Migration failed");
        log::info!("Migration success");

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

        log::info!("Starting push dispatcher");

        let push_processor_1 =
            ActorProcessor::new(push_consumer_1, push_dispatcher_1.start().recipient());

        let email_dispatcher_1 = DispatcherActor::new(Arc::new(EmailDispatcher::new(
            notification_repo.clone(),
            user_notification_repo.clone(),
            template_repo.clone(),
            email_producer.clone(),
        )));

        log::info!("Starting email dispatcher");

        let email_processor_1 =
            ActorProcessor::new(email_consumer_1, email_dispatcher_1.start().recipient());

        // init the application state
        let app_services = AppServices {
            notification_service,
            template_service,
            send_service,
            user_preferences_service,
            user_devices_service,
        };
        let app_processor = AppProcessors {
            push_processor_1,
            email_processor_1,
        };
        AppState {
            services: app_services,
            processors: app_processor,
        }
    }
}
