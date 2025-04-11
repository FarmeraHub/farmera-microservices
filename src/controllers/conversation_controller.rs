use std::sync::Arc;

use actix_web::{web, HttpResponse, Responder};

use crate::services::convesation_service::ConversationService;

pub struct ConversationController {
    conversation_service: Arc<ConversationService>,
}

impl ConversationController {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(
            web::resource("/conversation/{id}").route(web::get().to(Self::get_conversation_by_id)),
        );
    }

    pub fn new(conversation_service: Arc<ConversationService>) -> Self {
        Self {
            conversation_service,
        }
    }

    pub async fn get_conversation_by_id(
        self_controller: web::Data<Arc<ConversationController>>,
        id: web::Path<i32>,
    ) -> impl Responder {
        let id = id.into_inner();

        match self_controller
            .conversation_service
            .get_conversation_by_id(id)
            .await
        {
            Ok(result) => HttpResponse::Ok().json(result),
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
