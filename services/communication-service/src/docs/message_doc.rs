use crate::models::{message::Message, response_wrapper::{ResponseWrapper, UnitStruct}};

#[utoipa::path(
    get,
    path = "/api/message/{message_id}",
    params(
        ("message_id" = i64, Path, description = "ID of the message")
    ),
    tag = "Message",
    responses(
        (
            status = 200, 
            description = "Message found",
            body = ResponseWrapper<Message>,
        ),
        (
            status = 404, 
            description = "Message not found", 
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub async fn get_message_by_id() {}

#[utoipa::path(
    delete,
    path = "/api/message/{message_id}",
    params(
        ("message_id" = i64, Path, description = "ID of the message")
    ),
    tag = "Message",
    responses(
        (
            status = 200, 
            description = "Deleted",
            body = ResponseWrapper<UnitStruct>
        ),
        (
            status = 500, 
            description = "Delete failed", 
        )
    )
)]
#[allow(dead_code)]
pub async fn delete_message() {}
