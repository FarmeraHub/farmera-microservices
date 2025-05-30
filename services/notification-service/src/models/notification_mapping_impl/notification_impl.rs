use std::collections::HashMap;

use farmera_grpc_proto::{
    NotificationChannel, NotificationType,
    notification::{
        CreateNotificationRequest, CreateNotificationResponse, CreateTemplateNotificationRequest,
        CreateTemplateNotificationResponse, SendNotificationRequest,
    },
};
use uuid::Uuid;

use crate::models::{
    Channel,
    notification::{NewNotification, NewTemplateNotification, Notification, SendNotification},
};

use super::{
    NotiType, SAttachment, SEmail, convert_i32_to_channel, convert_string_map_to_hash_map,
    datetime_to_grpc_timestamp,
};

// Convert gRPC CreateNotificationRequest to NewNotifcation
impl TryFrom<CreateNotificationRequest> for NewNotification {
    type Error = &'static str;

    fn try_from(value: CreateNotificationRequest) -> Result<Self, Self::Error> {
        let channel = Channel::try_from(
            NotificationChannel::try_from(value.channel).map_err(|_| "Invalid channel value")?,
        )
        .map_err(|_| "Unsupported channel type")?;

        if value.title.is_empty() || value.content.is_empty() {
            return Err("Title or content cannot be empty");
        }

        Ok(NewNotification {
            template_id: None,
            title: value.title,
            content: value.content,
            channel,
        })
    }
}

// Convert Notification to gRPC CreateNotificationResponse
impl From<Notification> for CreateNotificationResponse {
    fn from(value: Notification) -> Self {
        CreateNotificationResponse {
            notification_id: value.notification_id,
            template_id: value.template_id,
            title: value.title,
            content: value.content,
            channel: NotificationChannel::from(value.channel) as i32,
            created: Some(datetime_to_grpc_timestamp(value.created)),
            updated: Some(datetime_to_grpc_timestamp(value.updated)), //prost_wkt_types
        }
    }
}

// Convert gRPC CreateTemplateNotificationRequest to NewTemplateNotification
impl TryFrom<CreateTemplateNotificationRequest> for NewTemplateNotification {
    type Error = &'static str;

    fn try_from(value: CreateTemplateNotificationRequest) -> Result<Self, Self::Error> {
        let channel = Channel::try_from(
            NotificationChannel::try_from(value.channel).map_err(|_| "Invalid channel value")?,
        )
        .map_err(|_| "Unsupported channel type")?;

        if value.title.is_empty() {
            return Err("Title cannot be empty");
        }

        Ok(NewTemplateNotification {
            template_id: value.template_id,
            title: value.title,
            props: value.props,
            channel: channel,
        })
    }
}

// Convert gRPC Notification to CreateTemaplateNotificationResponse
impl From<Notification> for CreateTemplateNotificationResponse {
    fn from(value: Notification) -> Self {
        CreateTemplateNotificationResponse {
            notification_id: value.notification_id,
            template_id: value.template_id,
            title: value.title,
            content: value.content,
            channel: NotificationChannel::from(value.channel) as i32,
            created: Some(datetime_to_grpc_timestamp(value.created)),
            updated: Some(datetime_to_grpc_timestamp(value.updated)), //prost_wkt_types
        }
    }
}

// Convert gRPC SendNotificationRequest to SendNotification
impl TryFrom<SendNotificationRequest> for SendNotification {
    type Error = &'static str;

    fn try_from(value: SendNotificationRequest) -> Result<Self, Self::Error> {
        if value.title.is_empty() {
            return Err("title cannot be empty");
        }
        let content_type = if value.content_type.is_empty() {
            "text/plain".to_string()
        } else {
            value.content_type
        };

        // Convert Option<String> to Option<Uuid>
        let recipient = value
            .recipent
            .map(|value| Uuid::parse_str(&value).map_err(|_| "Invalid UUID format for user_id"))
            .transpose()?;

        let notification_type = NotiType::try_from(
            NotificationType::try_from(value.notification_type)
                .map_err(|_| "Invalid type value")?,
        )
        .map_err(|_| "Unsupported notification type")?;

        let channels = convert_i32_to_channel(value.channels)?;

        let from = SEmail::try_from(value.from.ok_or("From email is required")?)?;
        // Convert Option<NotificationAttachmentList> to Option<Vec<Attachments>>
        let attachments = value
            .attachments
            .map(|list| {
                list.attachments
                    .into_iter()
                    .map(SAttachment::try_from)
                    .collect::<Result<Vec<SAttachment>, &'static str>>()
            })
            .transpose()?;

        let reply_to = value.reply_to.map(SEmail::try_from).transpose()?;

        Ok(SendNotification {
            recipent: recipient,
            notification_type: notification_type,
            channels: channels,
            from: from,
            title: value.title,
            content: value.content,
            content_type: content_type,
            template_id: value.template_id,
            template_props: convert_string_map_to_hash_map(value.template_props),
            attachments: attachments,
            reply_to: reply_to,
            retry_count: u8::default(),
            retry_ids: HashMap::default(),
            id: i64::default(),
        })
    }
}
