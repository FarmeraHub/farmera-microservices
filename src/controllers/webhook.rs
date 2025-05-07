use std::sync::Arc;

use actix_web::{HttpResponse, Responder, web};

use crate::{
    models::{email, reponse::Response},
    services::email_service::EmailService,
};

pub struct Webhook {
    email_service: Arc<EmailService>,
}

impl Webhook {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(web::scope("/webhook").route(
            "/sendgrid",
            web::post().to(Self::handle_sendgrid_hook_event),
        ));
    }

    pub fn new(email_service: Arc<EmailService>) -> Self {
        Self { email_service }
    }

    async fn handle_sendgrid_hook_event(
        self_controller: web::Data<Arc<Webhook>>,
        sendgrid_events: web::Json<Vec<email::SendGridEvent>>,
    ) -> impl Responder {
        self_controller
            .email_service
            .handle_sendgrid_hook_event(sendgrid_events.0)
            .await;

        HttpResponse::Ok().json(Response {
            r#type: "success".to_string(),
            message: format!("Events received"),
        })
    }
}
