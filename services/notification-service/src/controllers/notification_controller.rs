use std::sync::Arc;

use actix_web::{HttpResponse, Responder, http::StatusCode, web};

use crate::{
    errors::Error,
    models::{
        notification::{NewNotification, NewTemplateNotification, NotificationParams},
        reponse_wrapper::ResponseWrapper,
    },
    services::notification_service::NotificationService,
};

pub struct NotificationController {
    notification_service: Arc<NotificationService>,
}

impl NotificationController {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(
            web::scope("/notification")
                .route("", web::post().to(Self::create_notification))
                .route("", web::get().to(Self::get_notifications))
                .route(
                    "/template",
                    web::post().to(Self::create_template_notification),
                ),
        );
    }

    pub fn new(notification_service: Arc<NotificationService>) -> Self {
        Self {
            notification_service,
        }
    }

    async fn create_notification(
        self_controller: web::Data<Arc<NotificationController>>,
        notification: web::Json<NewNotification>,
    ) -> impl Responder {
        match self_controller
            .notification_service
            .create_notification(notification.0)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(notification) => ResponseWrapper::build(
                StatusCode::CREATED,
                "Notification created",
                Some(notification),
            ),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn create_template_notification(
        self_controller: web::Data<Arc<NotificationController>>,
        notification: web::Json<NewTemplateNotification>,
    ) -> impl Responder {
        match self_controller
            .notification_service
            .create_template_notification(notification.0)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => {
                if let Some(notification) = result {
                    ResponseWrapper::build(
                        StatusCode::CREATED,
                        "Template notification created",
                        Some(notification),
                    )
                } else {
                    ResponseWrapper::<()>::build(StatusCode::NOT_FOUND, "Template not found", None)
                }
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn get_notifications(
        self_controller: web::Data<Arc<NotificationController>>,
        params: web::Query<NotificationParams>,
    ) -> impl Responder {
        match self_controller
            .notification_service
            .get_notifications(&params.order, params.limit, params.asc)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => {
                ResponseWrapper::build(StatusCode::OK, "Notifications retrieved", Some(result))
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
