use crate::models::notification::{NewNotification, NewTemplateNotification, Notification};

#[utoipa::path(
    post,
    path = "/api/notification",
    request_body = NewNotification,
    description = "Create a new notification",
    tag = "Notification",
    responses(
        (
            status = 201, 
            description = "Created",
        ),
        (
            status = 500, 
            description = "Create failed", 
        )
    )
)]
#[allow(dead_code)]
pub fn create_notification() {}

#[utoipa::path(
    post,
    path = "/api/notification/template",
    request_body = NewTemplateNotification,
    description = "Create a new notification with template",
    tag = "Notification",
    responses(
        (
            status = 201, 
            description = "Created",
        ),
        (
            status = 500, 
            description = "Create failed", 
        )
    )
)]
#[allow(dead_code)]
pub fn create_template_notification() {}

#[utoipa::path(
    get,
    path = "/api/notification",
    tag = "Notification",
    description = "Retrieve a list of notifications with optional sorting and pagination",
    params(
        ("order" = Option<String>, Query, description = "Order column of the notification"),
        ("limit" = Option<i32>, Query, description = "Limit the number of messages"),
        ("asc" = Option<bool>, Query, description = "Ascending and descending order"),
    ),
    responses(
        (
            status = 200, 
            description = "Success operation",
            body = Vec<Notification>,
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub fn get_notifications() {}