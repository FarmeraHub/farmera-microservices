use crate::models::{attachment::Attachment, upload_form::UploadFormSchema};


#[utoipa::path(
    post,
    path = "/api/v1/file/upload/conversation/{conversation_id}",
    tag = "Attachment",
    params(
        ("conversation_id" = i32, Path, description = "ID of the conversation")
    ),
    request_body(content = UploadFormSchema, content_type = "multipart/form-data"),
    responses(
        (
            status = 200, 
            description = "Uploaded",
        ),
        (
            status = 500, 
            description = "Internal server error", 
        )
    )
)]
#[allow(dead_code)]
pub async fn upload_file() {}

#[utoipa::path(
    get,
    path = "/api/v1/file/view/{tail:.*}",
    tag = "Attachment",
    params(
        ("tail:.*" = String, Path, description = "Uploaded file path")
    ),
    responses(
        (
            status = 200, 
            description = "Success",
        ),
        (
            status = 500, 
            description = "Internal server error", 
        )
    )
)]
#[allow(dead_code)]
pub async fn get_file() {}

#[utoipa::path(
    get,
    path = "/api/attachment/{attachment_id}",
    params(
        ("attachment_id" = i32, Path, description = "ID of the attachment")
    ),
    tag = "Attachment",
    responses(
        (
            status = 200, 
            description = "Attachment found",
            body = Attachment,
        ),
        (
            status = 404, 
            description = "Attachment not found", 
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub async fn get_attachment_by_id() {}

#[utoipa::path(
    get,
    path = "/api/attachment/conversation/{conversation_id}",
    params(
        ("conversation_id" = i32, Path, description = "ID of the conversation")
    ),
    tag = "Attachment",
    responses(
        (
            status = 200, 
            description = "Attachments found",
            body = Vec<Attachment>,
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub async fn get_attachments_by_conversation_id() {}

#[utoipa::path(
    get,
    path = "/api/attachment/message/{message_id}",
    params(
        ("message_id" = i64, Path, description = "ID of the message")
    ),
    tag = "Attachment",
    responses(
        (
            status = 200, 
            description = "Attachment found",
            body = Vec<Attachment>,
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub async fn get_attachments_by_message_id() {}