use actix_web::{Responder, http::StatusCode, web};

use crate::{
    app::AppServices,
    models::{email, reponse_wrapper::ResponseWrapper},
};

pub struct Webhook;

impl Webhook {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(web::scope("/webhook").route(
            "/sendgrid",
            web::post().to(Self::handle_sendgrid_hook_event),
        ));
    }

    async fn handle_sendgrid_hook_event(
        services: web::Data<AppServices>,
        sendgrid_events: web::Json<Vec<email::SendGridEvent>>,
    ) -> impl Responder {
        services
            .send_service
            .email_service
            .handle_sendgrid_hook_event(sendgrid_events.0)
            .await;

        ResponseWrapper::<()>::build(StatusCode::OK, "Events received", None)
    }
}
