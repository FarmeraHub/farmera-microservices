use actix_web::{web, HttpResponse, Responder};

use crate::{app::AppServices, errors::Error, models::response::Response};

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
                Some(result) => HttpResponse::Ok().json(result),
                None => HttpResponse::NotFound().json(Response {
                    r#type: "error".to_string(),
                    message: "Message not found".to_string(),
                }),
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
            Ok(_) => HttpResponse::Ok().json(Response {
                r#type: "success".to_string(),
                message: "Deleted".to_string(),
            }),
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
