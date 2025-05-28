use farmera_grpc_proto::{
    NotificationAttachment, NotificationChannel, NotificationEmail, NotificationType,
    PushMessageType,
};

use crate::models::Channel;

use super::{NotiType, PushType, SAttachment, SEmail};

// Convert gRPC NotificationChannel to enum Channel
impl TryFrom<NotificationChannel> for Channel {
    type Error = &'static str;

    fn try_from(value: NotificationChannel) -> Result<Self, Self::Error> {
        match value {
            NotificationChannel::Email => Ok(Channel::Email),
            NotificationChannel::Push => Ok(Channel::Push),
            NotificationChannel::ChannelUnspecified => Err("CHANNEL_UNSPECIFIED"),
        }
    }
}

// Convert enum Channel to gRPC NotificationChannel
impl From<Channel> for NotificationChannel {
    fn from(value: Channel) -> Self {
        match value {
            Channel::Email => NotificationChannel::Email,
            Channel::Push => NotificationChannel::Push,
        }
    }
}

// Convert gRPC NotificationType to server enum NotificationType
impl TryFrom<NotificationType> for NotiType {
    type Error = &'static str;

    fn try_from(value: NotificationType) -> Result<Self, Self::Error> {
        match value {
            NotificationType::Chat => Ok(NotiType::Chat),
            NotificationType::SystemAlert => Ok(NotiType::SystemAlert),
            NotificationType::Transactional => Ok(NotiType::Transactional),
            NotificationType::Unspecified => Err("NOTIFICATION_TYPE_UNSPECIFIED"),
        }
    }
}

// Convert server enum NotificationType to gRPC NotificationType
impl From<NotiType> for NotificationType {
    fn from(value: NotiType) -> Self {
        match value {
            NotiType::Chat => NotificationType::Chat,
            NotiType::SystemAlert => NotificationType::SystemAlert,
            NotiType::Transactional => NotificationType::Transactional,
        }
    }
}

// Convert gRPC PushMessageType to server enum PushMessageType
impl TryFrom<PushMessageType> for PushType {
    type Error = &'static str;

    fn try_from(value: PushMessageType) -> Result<Self, Self::Error> {
        match value {
            PushMessageType::Condition => Ok(PushType::Condition),
            PushMessageType::Token => Ok(PushType::Token),
            PushMessageType::Topic => Ok(PushType::Topic),
            PushMessageType::Unspecified => Err("PUSH_TYPE_UNSPECIFIED"),
        }
    }
}

// Convert server enum PushMessageType to gRPC PushMessageType
impl From<PushType> for PushMessageType {
    fn from(value: PushType) -> Self {
        match value {
            PushType::Condition => PushMessageType::Condition,
            PushType::Token => PushMessageType::Token,
            PushType::Topic => PushMessageType::Topic,
        }
    }
}

// Convert gRPC NotificationEmail to email::Email
impl TryFrom<NotificationEmail> for SEmail {
    type Error = &'static str;

    fn try_from(value: NotificationEmail) -> Result<Self, Self::Error> {
        if value.email.is_empty() {
            return Err("email cannot be empty");
        }
        Ok(SEmail {
            email: value.email,
            name: value.name,
        })
    }
}

// Convert email::Email to gRPC NotificationEmail
impl From<SEmail> for NotificationEmail {
    fn from(value: SEmail) -> Self {
        NotificationEmail {
            email: value.email,
            name: value.name,
        }
    }
}

// Convert gRPC NotificationAttachment to email::Attachment
impl TryFrom<NotificationAttachment> for SAttachment {
    type Error = &'static str;

    fn try_from(value: NotificationAttachment) -> Result<Self, Self::Error> {
        if value.content.is_empty() {
            return Err("content cannot be empty");
        }
        if value.filename.is_empty() {
            return Err("filename cannot be empty");
        }
        if value.mime_type.is_empty() {
            return Err("mime_type cannot be empty");
        }
        let disposition = if value.disposition.is_empty() {
            "attachment".to_string()
        } else {
            value.disposition.clone()
        };

        Ok(SAttachment {
            content: value.content,
            filename: value.filename,
            r#type: value.mime_type,
            disposition: disposition,
        })
    }
}

// Convert email::Attachment to gRPC NotificationAttachment
impl From<SAttachment> for NotificationAttachment {
    fn from(value: SAttachment) -> Self {
        NotificationAttachment {
            content: value.content,
            filename: value.filename,
            mime_type: value.r#type,
            disposition: value.disposition,
        }
    }
}
