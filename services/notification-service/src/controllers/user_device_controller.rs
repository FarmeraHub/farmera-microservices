use actix_web::{
    HttpResponse, Responder,
    http::StatusCode,
    web::{self, ServiceConfig},
};

use crate::{
    app::AppServices,
    errors::Error,
    models::{UserIdQuery, reponse_wrapper::ResponseWrapper, user_preferences::UserDeviceToken},
};

pub struct UserDeviceController;

impl UserDeviceController {
    pub fn routes(cfg: &mut ServiceConfig) {
        cfg.service(
            web::resource("/devices")
                .get(Self::get_user_device_tokens)
                .post(Self::create_user_device_token)
                .delete(Self::delete_user_device_token),
        );
    }

    async fn create_user_device_token(
        services: web::Data<AppServices>,
        user_token: web::Json<UserDeviceToken>,
    ) -> impl Responder {
        match services
            .user_devices_service
            .create_user_device_token(&user_token.0)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => {
                ResponseWrapper::build(StatusCode::CREATED, "Device token created", Some(result))
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn get_user_device_tokens(
        services: web::Data<AppServices>,
        query: web::Query<UserIdQuery>,
    ) -> impl Responder {
        let user_id = query.into_inner().user_id;
        match services
            .user_devices_service
            .get_user_device_token(user_id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => {
                ResponseWrapper::build(StatusCode::OK, "User device tokens retrieved", Some(result))
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn delete_user_device_token(
        services: web::Data<AppServices>,
        query: web::Query<UserDeviceToken>,
    ) -> impl Responder {
        let token = &query.token;
        let user_id = query.user_id;
        match services
            .user_devices_service
            .delete_user_device_token(user_id, &token)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(_) => {
                ResponseWrapper::<()>::build(StatusCode::OK, "User device token deleted", None)
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
