use std::sync::Arc;

use actix_web::{
    HttpResponse, Responder,
    web::{self, ServiceConfig},
};

use crate::{
    errors::Error,
    models::{UserIdQuery, reponse::Response, user_preferences::UserDeviceToken},
    services::user_devices_service::UserDeviceService,
};

pub struct UserDeviceController {
    user_device_service: Arc<UserDeviceService>,
}

impl UserDeviceController {
    pub fn new(user_device_service: Arc<UserDeviceService>) -> Self {
        Self {
            user_device_service,
        }
    }

    pub fn routes(cfg: &mut ServiceConfig) {
        cfg.service(
            web::resource("/devices")
                .get(Self::get_user_device_token)
                .post(Self::create_user_device_token)
                .delete(Self::delete_user_device_token),
        );
    }

    async fn create_user_device_token(
        self_controller: web::Data<Arc<UserDeviceController>>,
        user_token: web::Json<UserDeviceToken>,
    ) -> impl Responder {
        match self_controller
            .user_device_service
            .create_user_device_token(&user_token.0)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => HttpResponse::Created().json(result),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn get_user_device_token(
        self_controller: web::Data<Arc<UserDeviceController>>,
        query: web::Query<UserIdQuery>,
    ) -> impl Responder {
        let user_id = query.into_inner().user_id;
        match self_controller
            .user_device_service
            .get_user_device_token(user_id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => HttpResponse::Ok().json(result),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn delete_user_device_token(
        self_controller: web::Data<Arc<UserDeviceController>>,
        token: web::Query<String>,
    ) -> impl Responder {
        let token = &token.0;
        match self_controller
            .user_device_service
            .delete_user_device_token(token)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(_) => HttpResponse::Ok().json(Response {
                r#type: "success".to_string(),
                message: "success".to_string(),
            }),
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
