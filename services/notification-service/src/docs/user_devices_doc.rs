use crate::models::{reponse_wrapper::{ResponseWrapper, UnitStruct}, user_preferences::UserDeviceToken};

#[utoipa::path(
    get,
    path = "/api/user/devices",
    params(
        ("user_id" = String, Query, description = "ID of the user"),
    ),
    tag = "User Devices",
    description = "Retrieve a user device tokens by user ID",
    responses(
        (
            status = 200, 
            description = "User device tokens found",
            body = ResponseWrapper<Vec<String>>,
            example = json!({
                "status": 200,
                "message": "User device tokens retrieved",
                "data": [
                    "token1",
                    "token2"
                ]
            })
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub fn get_user_device_token() {}

#[utoipa::path(
    post,
    path = "/api/user/devices",
    request_body = UserDeviceToken,
    tag = "User Devices",
    description = "Create a new user device token",
    responses(
        (
            status = 201, 
            description = "Created",
            body = ResponseWrapper<UserDeviceToken>,
        ),
        (
            status = 500, 
            description = "Create failed", 
        )
    )
)]
#[allow(dead_code)]
pub fn create_user_device_token() {}

#[utoipa::path(
    delete,
    path = "/api/user/devices",
    tag = "User Devices",
    description = "Create a new user device token",
    params(
        ("token" = String, Query, description = "Token of the device"),
    ),
    responses(
        (
            status = 200, 
            description = "Deleted",
            body = ResponseWrapper<UnitStruct>
        ),
        (
            status = 500, 
            description = "Create failed", 
        )
    )
)]
#[allow(dead_code)]
pub fn delete_user_device_token() {}