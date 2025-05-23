use std::sync::Arc;

use actix_web::{HttpResponse, Responder, http::StatusCode, web};

use crate::{
    errors::Error,
    models::{
        reponse_wrapper::ResponseWrapper,
        template::{NewTemplate, TemplateParams},
    },
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
                .route("", web::get().to(Self::get_templates))
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
                Some(template) => {
                    ResponseWrapper::build(StatusCode::OK, "Template found", Some(template))
                }
                None => {
                    ResponseWrapper::<()>::build(StatusCode::NOT_FOUND, "Template not found", None)
                }
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
            Ok(template) => {
                ResponseWrapper::build(StatusCode::CREATED, "Template created", Some(template))
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn get_templates(
        self_controller: web::Data<Arc<TemplateController>>,
        params: web::Query<TemplateParams>,
    ) -> impl Responder {
        match self_controller
            .template_service
            .get_templates(&params.order, params.limit, params.asc)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => {
                ResponseWrapper::build(StatusCode::OK, "Templates retrieved", Some(result))
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
