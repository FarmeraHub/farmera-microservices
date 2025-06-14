use actix_web::{http::StatusCode, web, HttpResponse, Responder};
use serde::Deserialize;
use uuid::Uuid;

use crate::{app::AppServices, errors::Error, models::response_wrapper::ResponseWrapper};

#[derive(Deserialize)]
struct OnlineQuery {
    user_id: Uuid,
}

pub struct UserController;

impl UserController {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(web::scope("/user").route("/online", web::get().to(Self::check_online_user)));
    }

    async fn check_online_user(
        services: web::Data<AppServices>,
        query: web::Query<OnlineQuery>,
    ) -> impl Responder {
        let user_id = query.into_inner().user_id;

        match services
            .user_service
            .check_online_user(user_id)
            .await
            .map_err(|_| Error::InternalServerError)
        {
            Ok(result) => ResponseWrapper::build(StatusCode::OK, "success", Some(result)),
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
