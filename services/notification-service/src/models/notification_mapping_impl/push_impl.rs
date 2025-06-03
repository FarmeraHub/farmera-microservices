use std::collections::HashMap;

use farmera_grpc_proto::{PushMessageType, notification::SendPushNotificationRequest};

use crate::models::push::PushMessage;

use super::{PushType, convert_string_map_to_hash_map};

impl TryFrom<SendPushNotificationRequest> for PushMessage {
    type Error = &'static str;

    fn try_from(value: SendPushNotificationRequest) -> Result<Self, Self::Error> {
        if value.title.is_empty() {
            return Err("title cannot be empty");
        }

        let push_type = PushType::try_from(
            PushMessageType::try_from(value.r#type).map_err(|_| "Invalid type value")?,
        )
        .map_err(|_| "Unsupported channel type")?;

        Ok(PushMessage {
            recipient: value.recipient,
            r#type: push_type,
            template_id: value.template_id,
            template_props: convert_string_map_to_hash_map(value.template_props),
            title: value.title,
            content: value.content,
            retry_count: u8::default(),
            retry_ids: HashMap::default(),
        })
    }
}
