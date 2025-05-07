use utoipa::OpenApi;

use crate::docs::{notification_doc, send_doc, template_doc};

#[derive(OpenApi)]
#[openapi(
    paths(
        template_doc::get_template_by_id,
        template_doc::create_template,
        template_doc::get_templates,

        notification_doc::create_notification,
        notification_doc::create_template_notification,
        notification_doc::get_notifications,

        send_doc::send_push,
        send_doc::send_email,
    ),
    tags(
        (name = "Notification", description = "Notification operations"),
        (name = "Template", description = "Template operations"),
        (name = "Send Notification", description = "Send notification to message queue"),
    )
)]
pub struct ApiDoc;
