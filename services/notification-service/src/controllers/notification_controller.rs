use actix_web::{HttpResponse, Responder, http::StatusCode, web};

use crate::{
    app::AppServices,
    errors::Error,
    models::{
        notification::{NewNotification, NewTemplateNotification, NotificationParams},
        reponse_wrapper::ResponseWrapper,
    },
};

pub struct NotificationController;

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

    async fn create_notification(
        services: web::Data<AppServices>,
        notification: web::Json<NewNotification>,
    ) -> impl Responder {
        let mut new_notification = notification.into_inner();
        match services
            .notification_service
            .create_notification(&mut new_notification)
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
        services: web::Data<AppServices>,
        notification: web::Json<NewTemplateNotification>,
    ) -> impl Responder {
        match services
            .notification_service
            .create_template_notification(&notification.0)
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
        services: web::Data<AppServices>,
        params: web::Query<NotificationParams>,
    ) -> impl Responder {
        match services
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
