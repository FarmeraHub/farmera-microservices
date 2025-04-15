use std::sync::Arc;

use actix_web::{web, HttpResponse, Responder};

use crate::{
    errors::Error,
    models::conversation::{MessageParams, NewConversation},
    services::convesation_service::ConversationService,
};

pub struct ConversationController {
    conversation_service: Arc<ConversationService>,
}

impl ConversationController {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(
            web::scope("/conversation")
                .route("/", web::post().to(Self::create_conversation))
                .route(
                    "/{conversation_id}",
                    web::get().to(Self::get_conversation_by_id),
                )
                .route(
                    "/{conversation_id}",
                    web::delete().to(Self::delete_conversation),
                )
                .route(
                    "/{conversation_id}/participants",
                    web::get().to(Self::get_conversation_participants),
                )
                .route(
                    "/{conversation_id}/messages",
                    web::get().to(Self::get_conversation_messages),
                ),
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
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => match result {
                Some(result) => HttpResponse::Ok().json(result),
                None => HttpResponse::NotFound().body("Conversation not found"),
            },
            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn create_conversation(
        self_controller: web::Data<Arc<ConversationController>>,
        new_conversation: web::Json<NewConversation>,
    ) -> impl Responder {
        match self_controller
            .conversation_service
            .create_conversation(&new_conversation.title)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(_) => HttpResponse::Ok().body("Success"),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn delete_conversation(
        self_controller: web::Data<Arc<ConversationController>>,
        conversation_id: web::Path<i32>,
    ) -> impl Responder {
        let id = conversation_id.into_inner();
        match self_controller
            .conversation_service
            .delete_conversation(id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(_) => HttpResponse::Ok().body("Deleted"),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn get_conversation_participants(
        self_controller: web::Data<Arc<ConversationController>>,
        conversation_id: web::Path<i32>,
    ) -> impl Responder {
        let id = conversation_id.into_inner();

        match self_controller
            .conversation_service
            .get_conversation_participants(id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => HttpResponse::Ok().json(result),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn get_conversation_messages(
        self_controller: web::Data<Arc<ConversationController>>,
        conversation_id: web::Path<i32>,
        params: web::Query<MessageParams>,
    ) -> impl Responder {
        let conversation_id = conversation_id.into_inner();
        let limit = params.limit;
        let before = params.before;

        match self_controller
            .conversation_service
            .get_conversation_messages(conversation_id, limit, before)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => HttpResponse::Ok().json(result),
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
