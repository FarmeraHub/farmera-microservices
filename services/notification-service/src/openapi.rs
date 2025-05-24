use utoipa::OpenApi;

use crate::docs::{
    notification_doc, send_doc, template_doc, user_devices_doc, user_preferences_doc,
};

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
        send_doc::send,

        user_preferences_doc::get_user_preferences,
        user_preferences_doc::create_user_preferences,
        user_preferences_doc::update_user_preferences,

        user_devices_doc::get_user_device_token,
        user_devices_doc::create_user_device_token,
    ),
    tags(
        (name = "Notification", description = "Notification operations"),
        (name = "Template", description = "Template operations"),
        (name = "Send Notification", description = "Send notification to message queue"),
        (name = "User Preferences", description = "User preferences operations"),
    )
)]
pub struct ApiDoc;
