use std::sync::Arc;

use actix_web::{
    HttpResponse, Responder,
    web::{self, ServiceConfig},
};

use crate::{
    errors::Error,
    models::{UserIdQuery, user_preferences::NewUserPreferences},
    services::user_preferences_service::UserPreferencesService,
};

pub struct UserPreferencesController {
    user_preferences_service: Arc<UserPreferencesService>,
}

impl UserPreferencesController {
    pub fn new(user_preferences_service: Arc<UserPreferencesService>) -> Self {
        Self {
            user_preferences_service,
        }
    }

    pub fn routes(cfg: &mut ServiceConfig) {
        cfg.service(
            web::scope("/preferences")
                .route("", web::get().to(Self::get_user_preferences))
                .route("", web::post().to(Self::create_user_preferences))
                .route("", web::put().to(Self::update_user_preferences)),
        );
    }

    async fn create_user_preferences(
        self_controller: web::Data<Arc<UserPreferencesController>>,
        user_preferences: web::Json<NewUserPreferences>,
    ) -> impl Responder {
        match self_controller
            .user_preferences_service
            .create_user_preferences(&user_preferences)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => HttpResponse::Created().json(result),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn get_user_preferences(
        self_controller: web::Data<Arc<UserPreferencesController>>,
        query: web::Query<UserIdQuery>,
    ) -> impl Responder {
        match self_controller
            .user_preferences_service
            .get_user_preferences_by_user_id(query.0.user_id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => HttpResponse::Ok().json(result),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn update_user_preferences(
        self_controller: web::Data<Arc<UserPreferencesController>>,
        user_preferences: web::Json<NewUserPreferences>,
    ) -> impl Responder {
        match self_controller
            .user_preferences_service
            .update_user_preferences(&user_preferences.0)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => HttpResponse::Ok().json(result),
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
