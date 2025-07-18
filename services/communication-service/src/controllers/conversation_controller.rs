use actix_web::{http::StatusCode, web, HttpRequest, HttpResponse, Responder};
use uuid::Uuid;

use crate::{
    app::AppServices,
    errors::Error,
    models::{
        conversation::{MessageParams, NewConversation, NewPrivateConversation},
        response_wrapper::ResponseWrapper,
        Pagination,
    },
};

pub struct ConversationController;

impl ConversationController {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(
            web::scope("/conversation")
                .route("", web::post().to(Self::create_conversation))
                .route("", web::get().to(Self::get_user_conversation))
                .route(
                    "/private",
                    web::post().to(Self::create_private_conversation),
                )
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

    async fn get_conversation_by_id(
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
                Some(result) => {
                    ResponseWrapper::build(StatusCode::OK, "Conversation retrieved", Some(result))
                }
                None => ResponseWrapper::<()>::build(
                    StatusCode::NOT_FOUND,
                    "Conversation not found",
                    None,
                ),
            },
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn create_conversation(
        services: web::Data<AppServices>,
        new_conversation: web::Json<NewConversation>,
    ) -> impl Responder {
        match services
            .conversation_service
            .create_conversation(&new_conversation.title)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => {
                ResponseWrapper::build(StatusCode::CREATED, "Conversation created", Some(result))
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn delete_conversation(
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
            Ok(_) => ResponseWrapper::<()>::build(StatusCode::OK, "Conversation deleted", None),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn get_conversation_participants(
        req: HttpRequest,
        services: web::Data<AppServices>,
        conversation_id: web::Path<i32>,
    ) -> impl Responder {
        let id: i32 = conversation_id.into_inner();

        // get user id from req
        let user_id = match req.headers().get("X-user-id").and_then(|v| v.to_str().ok()) {
            Some(id_str) => match Uuid::parse_str(id_str) {
                Ok(uuid) => uuid,
                Err(_) => return HttpResponse::Unauthorized().finish(),
            },
            None => return HttpResponse::Unauthorized().finish(),
        };

        match services
            .conversation_service
            .get_user_conversation_participants(user_id, id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => {
                ResponseWrapper::build(StatusCode::OK, "Participants retrieved", Some(result))
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn get_conversation_messages(
        req: HttpRequest,
        services: web::Data<AppServices>,
        conversation_id: web::Path<i32>,
        params: web::Query<MessageParams>,
    ) -> impl Responder {
        // get user id from req
        let user_id = match req.headers().get("X-user-id").and_then(|v| v.to_str().ok()) {
            Some(id_str) => match Uuid::parse_str(id_str) {
                Ok(uuid) => uuid,
                Err(_) => return HttpResponse::Unauthorized().finish(),
            },
            None => return HttpResponse::Unauthorized().finish(),
        };

        let conversation_id = conversation_id.into_inner();
        let limit = params.limit;
        let before = params.before;

        match services
            .conversation_service
            .get_conversation_messages(user_id, conversation_id, limit, before)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => {
                ResponseWrapper::build(StatusCode::OK, "Messages retrieved", Some(result))
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn get_user_conversation(
        req: HttpRequest,
        services: web::Data<AppServices>,
        query: web::Query<Pagination>,
    ) -> impl Responder {
        // get user id from req
        let user_id = match req.headers().get("X-user-id").and_then(|v| v.to_str().ok()) {
            Some(id_str) => match Uuid::parse_str(id_str) {
                Ok(uuid) => uuid,
                Err(_) => return HttpResponse::Unauthorized().finish(),
            },
            None => return HttpResponse::Unauthorized().finish(),
        };

        let pagination = query.into_inner();

        match services
            .conversation_service
            .get_user_conversation(user_id, pagination)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => {
                ResponseWrapper::build(StatusCode::OK, "Messages retrieved", Some(result))
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn create_private_conversation(
        req: HttpRequest,
        services: web::Data<AppServices>,
        new_conversation: web::Json<NewPrivateConversation>,
    ) -> impl Responder {
        // get user id from req
        let user_id = match req.headers().get("X-user-id").and_then(|v| v.to_str().ok()) {
            Some(id_str) => match Uuid::parse_str(id_str) {
                Ok(uuid) => uuid,
                Err(_) => return HttpResponse::Unauthorized().finish(),
            },
            None => return HttpResponse::Unauthorized().finish(),
        };

        let new_conversation = new_conversation.into_inner();

        match services
            .conversation_service
            .create_private_conversation(
                &new_conversation.title,
                user_id,
                new_conversation.other_user_id,
            )
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => {
                ResponseWrapper::build(StatusCode::CREATED, "Conversation created", Some(result))
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
