use farmera_grpc_proto::PushMessageType;

use super::PushType;

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
