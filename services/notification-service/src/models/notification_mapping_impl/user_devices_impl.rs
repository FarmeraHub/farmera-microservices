use farmera_grpc_proto::notification::{
    CreateUserDeviceTokenRequest, CreateUserDeviceTokenResponse,
};
use uuid::Uuid;

use crate::models::user_preferences::UserDeviceToken;

// Convert CreateUserDeviceTokenRequest to UserDeviceToken
impl TryFrom<CreateUserDeviceTokenRequest> for UserDeviceToken {
    type Error = &'static str;

    fn try_from(value: CreateUserDeviceTokenRequest) -> Result<Self, Self::Error> {
        let user_id =
            Uuid::parse_str(&value.user_id).map_err(|_| "Invalid UUID format for user_id")?;

        Ok(UserDeviceToken {
            user_id: user_id,
            token: value.device_token,
        })
    }
}

// Convert UserDeviceToken to CreateUserDeviceTokenResponse
impl From<UserDeviceToken> for CreateUserDeviceTokenResponse {
    fn from(value: UserDeviceToken) -> Self {
        CreateUserDeviceTokenResponse {
            user_id: value.user_id.to_string(),
            device_token: value.token,
        }
    }
}
