use crate::models::{email::EmailMessage, notification::SendNotification, push::PushMessage};

#[utoipa::path(
    post,
    path = "/api/send/push",
    request_body = PushMessage,
    description = "Send a push notification push message queue",
    tag = "Send Notification",
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
    path = "/api/send/email",
    request_body = EmailMessage,
    description = "Send an email notification email message queue",
    tag = "Send Notification",
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

#[utoipa::path(
    post,
    path = "/api/send",
    request_body = SendNotification,
    description = "Send a notification message queue",
    tag = "Send Notification",
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
pub fn send() {}