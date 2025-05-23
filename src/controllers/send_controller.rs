use std::sync::Arc;

use actix_web::{HttpResponse, Responder, web};

use crate::{
    errors::Error,
    models::{email, notification::SendNotification, push, reponse::Response},
    services::send_service::SendService,
};

pub struct SendController {
    send_service: Arc<SendService>,
}

impl SendController {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(
            web::scope("/send")
                .route("", web::post().to(Self::send))
                .route("/push", web::post().to(Self::send_push))
                .route("/email", web::post().to(Self::send_email)),
        );
    }

    pub fn new(send_service: Arc<SendService>) -> Self {
        Self { send_service }
    }

    pub async fn send_push(
        self_controller: web::Data<Arc<SendController>>,
        message: web::Json<push::PushMessage>,
    ) -> impl Responder {
        match self_controller
            .send_service
            .push_service
            .send_push(message.0)
            .await
            .map_err(|e| Error::Kafka(e))
        {
            Ok(()) => HttpResponse::Ok().json(Response {
                r#type: "success".to_string(),
                message: "queued".to_string(),
            }),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn send_email(
        self_controller: web::Data<Arc<SendController>>,
        message: web::Json<email::EmailMessage>,
    ) -> impl Responder {
        match self_controller
            .send_service
            .email_service
            .send_email(message.0)
            .await
            .map_err(|e| Error::Kafka(e))
        {
            Ok(()) => HttpResponse::Ok().json(Response {
                r#type: "success".to_string(),
                message: "queued".to_string(),
            }),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn send(
        self_controller: web::Data<Arc<SendController>>,
        send_notification: web::Json<SendNotification>,
    ) -> impl Responder {
        match self_controller
            .send_service
            .send(&send_notification.0)
            .await
        {
            Ok(()) => HttpResponse::Ok().json(Response {
                r#type: "success".to_string(),
                message: "queued".to_string(),
            }),
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
