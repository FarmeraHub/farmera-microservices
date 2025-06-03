use std::collections::HashMap;

use chrono::{DateTime, NaiveTime, Utc};
use farmera_grpc_proto::{NotificationChannel, StringMap};

use super::Channel;

pub mod common_impl;
pub mod email_impl;
pub mod notification_impl;
pub mod push_impl;
pub mod template_impl;
pub mod user_devices_impl;
pub mod user_preferences_impl;

// Define new type avoid dupplication with proto file
type NotiType = super::NotificationType;
type PushType = super::push::PushMessageType;
type SEmail = super::email::Email;
type SAttachment = super::email::Attachments;

/// Helper functions

// Convert DateTime<Utc> to gRPC Timestamp
fn datetime_to_grpc_timestamp(dt: DateTime<Utc>) -> farmera_grpc_proto::Timestamp {
    let timestamp = prost_wkt_types::Timestamp {
        seconds: dt.timestamp(),
        nanos: dt.timestamp_subsec_nanos() as i32,
    };
    farmera_grpc_proto::Timestamp {
        value: Some(timestamp),
    }
}

// Convert Vec<i32> to Vec<Channel>
fn convert_i32_to_channel(channels: Vec<i32>) -> Result<Vec<Channel>, &'static str> {
    channels
        .into_iter()
        .map(|c| {
            NotificationChannel::try_from(c)
                .map_err(|_| "Invalid channel value")?
                .try_into()
        })
        .collect::<Result<Vec<Channel>, &'static str>>()
}

// Convert string to NaiveTime
fn parse_time(time_str: Option<String>) -> Result<Option<NaiveTime>, &'static str> {
    time_str
        .map(|s| {
            NaiveTime::parse_from_str(&s, "%H:%M:%S%.f")
                .map_err(|_| "Invalid time format, expected HH:MM:SS[.ffffff]")
        })
        .transpose()
}

// Convert Vec<Channel> to Vec<i32>
fn convert_channels_to_i32(channels: Vec<Channel>) -> Vec<i32> {
    channels
        .into_iter()
        .map(|c| NotificationChannel::from(c) as i32)
        .collect()
}

// Convert Option<NaiveTime> to Option<String>
fn time_to_string(time: Option<NaiveTime>) -> Option<String> {
    time.map(|t| t.format("%H:%M:%S%.f").to_string())
}

// Convert gRPC StringMap to HashMap<String, String>
fn convert_string_map_to_hash_map(map: Option<StringMap>) -> Option<HashMap<String, String>> {
    map.map(|m| m.values.into_iter().collect())
}
