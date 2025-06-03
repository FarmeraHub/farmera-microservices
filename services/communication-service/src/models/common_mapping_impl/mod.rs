use chrono::{DateTime, Utc};

use crate::models::{
    conversation::ConversationMessages, notification_models::push,
    user_conversation::UserConversation, MessageType,
};

pub mod enums;
pub mod pagination;

// Define new type avoid dupplication with proto file
pub type MsgType = MessageType;
pub type PushType = push::PushMessageType;
pub type UsrCvs = UserConversation;
pub type CvsMsg = ConversationMessages;

/// Helper functions

// Convert DateTime<Utc> to gRPC Timestamp
pub fn datetime_to_grpc_timestamp(dt: DateTime<Utc>) -> farmera_grpc_proto::Timestamp {
    let timestamp = prost_wkt_types::Timestamp {
        seconds: dt.timestamp(),
        nanos: dt.timestamp_subsec_nanos() as i32,
    };
    farmera_grpc_proto::Timestamp {
        value: Some(timestamp),
    }
}

pub fn grpc_timestamp_to_datetime(
    ts: farmera_grpc_proto::Timestamp,
) -> Result<DateTime<Utc>, &'static str> {
    let prost_ts = if let Some(val) = ts.value {
        val
    } else {
        return Err("Empty value");
    };
    let datetime: DateTime<Utc> = prost_ts
        .try_into()
        .map_err(|_| "Cannot parse grpc timestamp to datetime")?;
    Ok(datetime)
}
