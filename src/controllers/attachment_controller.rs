use std::sync::Arc;

use actix_multipart::form::MultipartForm;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use uuid::Uuid;

use crate::{models::upload_form::UploadForm, services::attachment_service::AttachmentService};

pub struct AttachmentController {
    attachment_service: Arc<AttachmentService>,
}

impl AttachmentController {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(web::scope("/attachment").route(
            "/{conversation_id}",
            web::post().to(Self::upload_attachment),
        ));
    }

    pub fn new(attachment_service: Arc<AttachmentService>) -> Self {
        Self { attachment_service }
    }

    pub async fn upload_attachment(
        self_controller: web::Data<Arc<AttachmentController>>,
        _req: HttpRequest,
        MultipartForm(form): MultipartForm<UploadForm>,
        path: web::Path<i32>,
    ) -> impl Responder {
        // let user_id = req.extensions();
        let user_id = Uuid::parse_str("c8dd591b-4105-4608-869b-1dfb96f313b3").unwrap();

        let conversation_id = path.into_inner();

        match self_controller
            .attachment_service
            .upload_attachment(form, conversation_id, user_id)
            .await
        {
            Ok(result) => HttpResponse::Created().json(result),
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
