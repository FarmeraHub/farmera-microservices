use farmera_grpc_proto::notification::{
    CreateUserPreferencesRequest, CreateUserPreferencesResponse, GetUserPreferencesResponse,
    UpdateUserPreferencesRequest, UpdateUserPreferencesResponse,
};
use uuid::Uuid;

use crate::models::user_preferences::{NewUserPreferences, UserPreferences};

use super::{convert_channels_to_i32, convert_i32_to_channel, parse_time, time_to_string};

// Convert gRPC CreateUserPreferencesRequest to model NewUserPreferences
impl TryFrom<CreateUserPreferencesRequest> for NewUserPreferences {
    type Error = &'static str;

    fn try_from(value: CreateUserPreferencesRequest) -> Result<Self, Self::Error> {
        // Parse user_id to Uuid
        let user_id =
            Uuid::parse_str(&value.user_id).map_err(|_| "Invalid UUID format for user_id")?;

        // Validate user_email
        if value.user_email.is_empty() {
            return Err("user_email cannot be empty");
        }

        // Convert channel lists
        let transactional_channels = convert_i32_to_channel(value.transactional_channels)?;
        let system_alert_channels = convert_i32_to_channel(value.system_alert_channels)?;
        let chat_channels = convert_i32_to_channel(value.chat_channels)?;

        // Parse do_not_disturb times
        let do_not_disturb_start = parse_time(value.do_not_disturb_start)?;
        let do_not_disturb_end = parse_time(value.do_not_disturb_end)?;

        // Validate time_zone (basic non-empty check, could add chrono::TimeZone validation)
        if value.time_zone.is_empty() {
            return Err("time_zone cannot be empty");
        }

        Ok(NewUserPreferences {
            user_id,
            user_email: value.user_email,
            transactional_channels,
            system_alert_channels,
            chat_channels,
            do_not_disturb_start,
            do_not_disturb_end,
            time_zone: value.time_zone,
        })
    }
}

// Convert UserPreferences to gRPC CreateUserPreferencesResponse
impl From<UserPreferences> for CreateUserPreferencesResponse {
    fn from(value: UserPreferences) -> Self {
        CreateUserPreferencesResponse {
            user_id: value.user_id.to_string(),
            user_email: value.user_email,
            transactional_channels: convert_channels_to_i32(value.transactional_channels),
            system_alert_channels: convert_channels_to_i32(value.system_alert_channels),
            chat_channels: convert_channels_to_i32(value.chat_channels),
            do_not_disturb_start: time_to_string(value.do_not_disturb_start),
            do_not_disturb_end: time_to_string(value.do_not_disturb_end),
            time_zone: value.time_zone,
        }
    }
}

// Convert UserPreferences to gRPC GetUserPreferencesResponse
impl From<UserPreferences> for GetUserPreferencesResponse {
    fn from(value: UserPreferences) -> Self {
        GetUserPreferencesResponse {
            user_id: value.user_id.to_string(),
            user_email: value.user_email,
            transactional_channels: convert_channels_to_i32(value.transactional_channels),
            system_alert_channels: convert_channels_to_i32(value.system_alert_channels),
            chat_channels: convert_channels_to_i32(value.chat_channels),
            do_not_disturb_start: time_to_string(value.do_not_disturb_start),
            do_not_disturb_end: time_to_string(value.do_not_disturb_end),
            time_zone: value.time_zone,
        }
    }
}

// Convert UpdateUserPreferencesRequest to NewUserPreferences
impl TryFrom<UpdateUserPreferencesRequest> for NewUserPreferences {
    type Error = &'static str;

    fn try_from(value: UpdateUserPreferencesRequest) -> Result<Self, Self::Error> {
        // Parse user_id to Uuid
        let user_id =
            Uuid::parse_str(&value.user_id).map_err(|_| "Invalid UUID format for user_id")?;

        // Validate user_email
        if value.user_email.is_empty() {
            return Err("user_email cannot be empty");
        }

        // Convert channel lists
        let transactional_channels = convert_i32_to_channel(value.transactional_channels)?;
        let system_alert_channels = convert_i32_to_channel(value.system_alert_channels)?;
        let chat_channels = convert_i32_to_channel(value.chat_channels)?;

        // Parse do_not_disturb times
        let do_not_disturb_start = parse_time(value.do_not_disturb_start)?;
        let do_not_disturb_end = parse_time(value.do_not_disturb_end)?;

        // Validate time_zone (basic non-empty check, could add chrono::TimeZone validation)
        if value.time_zone.is_empty() {
            return Err("time_zone cannot be empty");
        }

        Ok(NewUserPreferences {
            user_id,
            user_email: value.user_email,
            transactional_channels,
            system_alert_channels,
            chat_channels,
            do_not_disturb_start,
            do_not_disturb_end,
            time_zone: value.time_zone,
        })
    }
}

// Convert UserPreferences to UpdateUserPreferencesResponse
impl From<UserPreferences> for UpdateUserPreferencesResponse {
    fn from(value: UserPreferences) -> Self {
        UpdateUserPreferencesResponse {
            user_id: value.user_id.to_string(),
            user_email: value.user_email,
            transactional_channels: convert_channels_to_i32(value.transactional_channels),
            system_alert_channels: convert_channels_to_i32(value.system_alert_channels),
            chat_channels: convert_channels_to_i32(value.chat_channels),
            do_not_disturb_start: time_to_string(value.do_not_disturb_start),
            do_not_disturb_end: time_to_string(value.do_not_disturb_end),
            time_zone: value.time_zone,
        }
    }
}
