use actix_files::NamedFile;
use actix_multipart::form::MultipartForm;
use actix_web::{http::StatusCode, web, HttpRequest, HttpResponse, Responder};
use uuid::Uuid;

use crate::{
    app::AppServices,
    errors::Error,
    models::{
        attachment::AttachmentParams, response_wrapper::ResponseWrapper, upload_form::UploadForm,
    },
};

pub struct AttachmentController;

impl AttachmentController {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(
            web::scope("v1/file")
                .route(
                    "/upload/conversation/{conversation_id}",
                    web::post().to(Self::upload_file),
                )
                .route("/view/{tail:.*}", web::get().to(Self::get_file)),
        )
        .service(
            web::scope("/attachment")
                .route(
                    "/{attachment_id}",
                    web::get().to(Self::get_attachment_by_id),
                )
                .route(
                    "/conversation/{conversation_id}",
                    web::get().to(Self::get_attachments_by_conversation_id),
                )
                .route(
                    "/message/{message_id}",
                    web::get().to(Self::get_attachments_by_message_id),
                ),
        );
    }

    pub async fn upload_file(
        services: web::Data<AppServices>,
        _req: HttpRequest,
        MultipartForm(form): MultipartForm<UploadForm>,
        path: web::Path<i32>,
    ) -> impl Responder {
        // let user_id = req.extensions();
        let user_id = Uuid::parse_str("c8dd591b-4105-4608-869b-1dfb96f313b3").unwrap();

        let conversation_id = path.into_inner();

        match services
            .attachment_service
            .upload_file(form, conversation_id, user_id)
            .await
        {
            Ok(result) => ResponseWrapper::build(StatusCode::OK, "File uploaded", Some(result)),
            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn get_file(
        services: web::Data<AppServices>,
        _req: HttpRequest,
        path: web::Path<String>,
    ) -> Result<NamedFile, actix_web::Error> {
        // let user_id = _req
        let attachment_path = path.into_inner();

        services
            .attachment_service
            .get_file_by_url(&attachment_path)
            .await
            .map_err(|e| e.into())
    }

    pub async fn get_attachment_by_id(
        services: web::Data<AppServices>,
        path: web::Path<i32>,
    ) -> impl Responder {
        let attachmet_id = path.into_inner();

        match services
            .attachment_service
            .get_attachment_by_id(attachmet_id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => match result {
                Some(result) => {
                    ResponseWrapper::build(StatusCode::OK, "Attachment retrieved", Some(result))
                }
                None => ResponseWrapper::<()>::build(
                    StatusCode::NOT_FOUND,
                    "Attachment not found",
                    None,
                ),
            },
            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn get_attachments_by_conversation_id(
        services: web::Data<AppServices>,
        path: web::Path<i32>,
        query: web::Query<AttachmentParams>,
    ) -> impl Responder {
        let conversation_id = path.into_inner();
        let before = query.before;
        let limit = query.limit;

        match services
            .attachment_service
            .get_attachments_by_conversation_id(conversation_id, before, limit)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => {
                ResponseWrapper::build(StatusCode::OK, "Attachments retrieved", Some(result))
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }

    pub async fn get_attachments_by_message_id(
        services: web::Data<AppServices>,
        path: web::Path<i64>,
    ) -> impl Responder {
        let message_id = path.into_inner();

        match services
            .attachment_service
            .get_attachment_by_message_id(message_id)
            .await
            .map_err(|e| Error::Db(e))
        {
            Ok(result) => {
                ResponseWrapper::build(StatusCode::OK, "Attachments retrieved", Some(result))
            }
            Err(e) => HttpResponse::from_error(e),
        }
    }
}
