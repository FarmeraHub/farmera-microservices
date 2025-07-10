use farmera_grpc_proto::{
    notification::SendPushNotificationRequest, NotificationType, PushMessageType, StringMap,
};

use crate::models::notification_models::push::PushMessage;

// Convert PushMessage to SendPushNotificationRequest
impl From<PushMessage> for SendPushNotificationRequest {
    fn from(value: PushMessage) -> Self {
        let props = if value.template_props.is_some() {
            Some(StringMap {
                values: value.template_props.unwrap(),
            })
        } else {
            None
        };

        SendPushNotificationRequest {
            recipient: value.recipient,
            r#type: PushMessageType::from(value.r#type) as i32,
            template_id: value.template_id,
            template_props: props,
            title: value.title,
            content: value.content,
            notification_type: NotificationType::from(value.notification_type) as i32,
        }
    }
}
