use actix_web::{web, HttpResponse, Responder};

use crate::{
    app::AppServices,
    errors::Error,
    models::{
        conversation::{MessageParams, NewConversation},
        response::Response,
    },
};

pub struct ConversationController;

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

    pub async fn get_conversation_by_id(
        services: web::Data<AppServices>,
        id: web::Path<i32>,
    ) -> impl Responder {
        let id = id.into_inner();

        match services
            .conversation_service
            .get_conversation_by_id(id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => match result {
                Some(result) => HttpResponse::Ok().json(result),
                None => HttpResponse::NotFound().json(Response {
                    r#type: "error".to_string(),
                    message: "Conversation not found".to_string(),
                }),
            },
            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn create_conversation(
        services: web::Data<AppServices>,
        new_conversation: web::Json<NewConversation>,
    ) -> impl Responder {
        match services
            .conversation_service
            .create_conversation(&new_conversation.title)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(id) => HttpResponse::Created().json(Response {
                r#type: "success".to_string(),
                message: format!("Conversation created - id: {id}"),
            }),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn delete_conversation(
        services: web::Data<AppServices>,
        conversation_id: web::Path<i32>,
    ) -> impl Responder {
        let id = conversation_id.into_inner();
        match services
            .conversation_service
            .delete_conversation(id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(_) => HttpResponse::Ok().json(Response {
                r#type: "success".to_string(),
                message: "Deleted".to_string(),
            }),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn get_conversation_participants(
        services: web::Data<AppServices>,
        conversation_id: web::Path<i32>,
    ) -> impl Responder {
        let id = conversation_id.into_inner();

        match services
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
        services: web::Data<AppServices>,
        conversation_id: web::Path<i32>,
        params: web::Query<MessageParams>,
    ) -> impl Responder {
        let conversation_id = conversation_id.into_inner();
        let limit = params.limit;
        let before = params.before;

        match services
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
