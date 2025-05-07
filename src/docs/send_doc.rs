use crate::models::{email::EmailMessage, push::PushMessage};

#[utoipa::path(
    post,
    path = "/api/notification/push/send",
    request_body = PushMessage,
    description = "Send a push notification push message queue",
    tag = "Notification",
    responses(
        (
            status = 200, 
            description = "Success",
        ),
        (
            status = 500, 
            description = "Create failed", 
        )
    )
)]
#[allow(dead_code)]
pub fn send_push() {}

#[utoipa::path(
    post,
    path = "/api/notification/email/send",
    request_body = EmailMessage,
    description = "Send an email notification email message queue",
    tag = "Notification",
    responses(
        (
            status = 200, 
            description = "Success",
        ),
        (
            status = 500, 
            description = "Create failed", 
        )
    )
)]
#[allow(dead_code)]
pub fn send_email() {}