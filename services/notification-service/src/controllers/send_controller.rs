use actix_web::{HttpResponse, Responder, http::StatusCode, web};

use crate::{
    app::AppServices,
    errors::Error,
    models::{email, notification::SendNotification, push, reponse_wrapper::ResponseWrapper},
};

pub struct SendController;

impl SendController {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(
            web::scope("/send")
                .route("", web::post().to(Self::send))
                .route("/push", web::post().to(Self::send_push))
                .route("/email", web::post().to(Self::send_email)),
        );
    }

    pub async fn send_push(
        services: web::Data<AppServices>,
        message: web::Json<push::PushMessage>,
    ) -> impl Responder {
        let send_message = message.into_inner();
        match services
            .send_service
            .push_service
            .send_push(&send_message)
            .await
            .map_err(|e| Error::Kafka(e))
        {
            Ok(()) => ResponseWrapper::<()>::build(StatusCode::OK, "Queued", None),

            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn send_email(
        services: web::Data<AppServices>,
        message: web::Json<email::EmailMessage>,
    ) -> impl Responder {
        let send_message = message.into_inner();
        match services
            .send_service
            .email_service
            .send_email(&send_message)
            .await
            .map_err(|e| Error::Kafka(e))
        {
            Ok(()) => ResponseWrapper::<()>::build(StatusCode::OK, "Queued", None),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn send(
        services: web::Data<AppServices>,
        send_notification: web::Json<SendNotification>,
    ) -> impl Responder {
        match services.send_service.send(&send_notification.0).await {
            Ok(result) => {
                let message = match result {
                    Some(message) => message,
                    None => "Queued".to_string(),
                };
                ResponseWrapper::<()>::build(StatusCode::OK, &message, None)
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
