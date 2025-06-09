use crate::models::response_wrapper::ResponseWrapper;

#[utoipa::path(
    get,
    path = "/api/user/online",
    tag = "User",
    params(
        ("user_id" = String, Query, description = "ID of the user")
    ),
    responses(
        (
            status = 200, 
            description = "User online status",
            body = ResponseWrapper<bool>,
        ),
        (
            status = 400, 
            description = "Invalid user id", 
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub async fn check_online_user() {}