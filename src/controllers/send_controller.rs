use std::sync::Arc;

use actix_web::{HttpResponse, Responder, web};

use crate::{
    errors::Error,
    models::{email, push, reponse::Response},
    services::{email_service::EmailService, push_service::PushService},
};

pub struct SendController {
    email_service: Arc<EmailService>,
    push_service: Arc<PushService>,
}

impl SendController {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(
            web::scope("/notification")
                .route("/push/send", web::post().to(Self::send_push))
                .route("/email/send", web::post().to(Self::send_email)),
        );
    }

    pub fn new(email_service: Arc<EmailService>, push_service: Arc<PushService>) -> Self {
        Self {
            email_service,
            push_service,
        }
    }

    pub async fn send_push(
        self_controller: web::Data<Arc<SendController>>,
        message: web::Json<push::PushMessage>,
    ) -> impl Responder {
        match self_controller
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
}
