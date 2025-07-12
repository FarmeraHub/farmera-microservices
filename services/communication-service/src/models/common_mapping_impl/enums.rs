use farmera_grpc_proto::{MessageType, NotificationType, PushMessageType};

use crate::models::{common_mapping_impl::PushType, notification_mapping_impl::NotiType};

use super::MsgType;

impl TryFrom<MessageType> for MsgType {
    type Error = &'static str;

    fn try_from(value: MessageType) -> Result<Self, Self::Error> {
        match value {
            MessageType::Media => Ok(MsgType::Media),
            MessageType::Message => Ok(MsgType::Message),
            MessageType::Unspecified => Err("MESSAGE_TYPE_UNSPECIFIED"),
        }
    }
}

impl From<MsgType> for MessageType {
    fn from(value: MsgType) -> Self {
        match value {
            MsgType::Media => MessageType::Media,
            MsgType::Message => MessageType::Message,
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

impl From<NotiType> for NotificationType {
    fn from(value: NotiType) -> Self {
        match value {
            NotiType::Chat => NotificationType::Chat,
            NotiType::SystemAlert => NotificationType::SystemAlert,
            NotiType::Transactional => NotificationType::Transactional,
        }
    }
}
