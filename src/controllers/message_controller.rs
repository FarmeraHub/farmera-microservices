use std::sync::Arc;

use actix_web::{web, HttpResponse, Responder};

use crate::{errors::Error, services::message_service::MessageService};

pub struct MessageController {
    messages_service: Arc<MessageService>,
}

impl MessageController {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(
            web::scope("/message")
                .route("/{message_id}", web::get().to(Self::get_message_by_id))
                .route("/{message_id}", web::delete().to(Self::delete_message)),
        );
    }

    pub fn new(messages_service: Arc<MessageService>) -> Self {
        Self { messages_service }
    }

    pub async fn get_message_by_id(
        self_controller: web::Data<Arc<MessageController>>,
        path: web::Path<i64>,
    ) -> impl Responder {
        let message_id = path.into_inner();

        match self_controller
            .messages_service
            .get_message_by_id(message_id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => match result {
                Some(result) => HttpResponse::Ok().json(result),
                None => HttpResponse::NotFound().body("Message not found"),
            },
            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn delete_message(
        self_controller: web::Data<Arc<MessageController>>,
        path: web::Path<i64>,
    ) -> impl Responder {
        let message_id = path.into_inner();

        match self_controller
            .messages_service
            .delete_message(message_id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(_) => HttpResponse::Ok().body("Deleted"),
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
