use actix_web::{http::StatusCode, web, HttpResponse, Responder};

use crate::{app::AppServices, errors::Error, models::response_wrapper::ResponseWrapper};

pub struct MessageController;

impl MessageController {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(
            web::scope("/message")
                .route("/{message_id}", web::get().to(Self::get_message_by_id))
                .route("/{message_id}", web::delete().to(Self::delete_message)),
        );
    }

    pub async fn get_message_by_id(
        services: web::Data<AppServices>,
        path: web::Path<i64>,
    ) -> impl Responder {
        let message_id = path.into_inner();

        match services
            .messages_service
            .get_message_by_id(message_id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => match result {
                Some(result) => {
                    ResponseWrapper::build(StatusCode::OK, "Message retrieved", Some(result))
                }
                None => {
                    ResponseWrapper::<()>::build(StatusCode::NOT_FOUND, "Message not found", None)
                }
            },
            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn delete_message(
        services: web::Data<AppServices>,
        path: web::Path<i64>,
    ) -> impl Responder {
        let message_id = path.into_inner();

        match services
            .messages_service
            .delete_message(message_id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(_) => ResponseWrapper::<()>::build(StatusCode::OK, "Message deleted", None),
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
