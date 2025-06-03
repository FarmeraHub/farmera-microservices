use actix_web::{
    HttpResponse, Responder,
    web::{self, ServiceConfig},
};

use crate::{
    app::AppServices,
    errors::Error,
    models::{UserIdQuery, user_preferences::NewUserPreferences},
};

pub struct UserPreferencesController;

impl UserPreferencesController {
    pub fn routes(cfg: &mut ServiceConfig) {
        cfg.service(
            web::scope("/preferences")
                .route("", web::get().to(Self::get_user_preferences))
                .route("", web::post().to(Self::create_user_preferences))
                .route("", web::put().to(Self::update_user_preferences)),
        );
    }

    async fn create_user_preferences(
        services: web::Data<AppServices>,
        user_preferences: web::Json<NewUserPreferences>,
    ) -> impl Responder {
        let mut user_preferences = user_preferences.into_inner();
        match services
            .user_preferences_service
            .create_user_preferences(&mut user_preferences)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => HttpResponse::Created().json(result),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn get_user_preferences(
        services: web::Data<AppServices>,
        query: web::Query<UserIdQuery>,
    ) -> impl Responder {
        match services
            .user_preferences_service
            .get_user_preferences_by_user_id(query.0.user_id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => match result {
                Some(user_preferences) => HttpResponse::Ok().json(user_preferences),
                None => HttpResponse::NotFound().finish(),
            },
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn update_user_preferences(
        services: web::Data<AppServices>,
        user_preferences: web::Json<NewUserPreferences>,
    ) -> impl Responder {
        match services
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
