use std::sync::Arc;

use actix_web::{HttpResponse, Responder, web};

use crate::{
    errors::Error,
    models::{reponse::Response, template::NewTemplate},
    services::template_service::TemplateService,
};

pub struct TemplateController {
    template_service: Arc<TemplateService>,
}

impl TemplateController {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(
            web::scope("/template")
                .route("/{template_id}", web::get().to(Self::get_template_by_id))
                .route("", web::post().to(Self::create_template)),
        );
    }

    pub fn new(template_service: Arc<TemplateService>) -> Self {
        Self { template_service }
    }

    async fn get_template_by_id(
        self_controller: web::Data<Arc<TemplateController>>,
        path: web::Path<i32>,
    ) -> impl Responder {
        let template_id = path.into_inner();

        match self_controller
            .template_service
            .get_template_by_id(template_id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => match result {
                Some(result) => HttpResponse::Ok().json(result),
                None => HttpResponse::NotFound().json(Response {
                    r#type: "error".to_string(),
                    message: "Template not found".to_string(),
                }),
            },
            Err(e) => HttpResponse::from_error(e),
        }
    }

    async fn create_template(
        self_controller: web::Data<Arc<TemplateController>>,
        template: web::Json<NewTemplate>,
    ) -> impl Responder {
        let template = template.into_inner();
        match self_controller
            .template_service
            .create_template(&template)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(id) => HttpResponse::Created().json(Response {
                r#type: "success".to_string(),
                message: format!("Template created - id: {id}"),
            }),
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
