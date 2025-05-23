use crate::models::{reponse_wrapper::ResponseWrapper, user_preferences::{NewUserPreferences, UserPreferences}};

#[utoipa::path(
    get,
    path = "/api/user/preferences",
    params(
        ("user_id" = String, Query, description = "ID of the user"),
    ),
    tag = "User Preferences",
    description = "Retrieve a specific user preferences by user ID",
    responses(
        (
            status = 200, 
            description = "User preferences found",
            body = ResponseWrapper<UserPreferences>,
        ),
        (
            status = 404, 
            description = "User preferences not found", 
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub fn get_user_preferences() {}

#[utoipa::path(
    post,
    path = "/api/user/preferences",
    request_body = NewUserPreferences,
    tag = "User Preferences",
    description = "Create a new user preferences",
    responses(
        (
            status = 201, 
            description = "Created",
            body = ResponseWrapper<UserPreferences>,
        ),
        (
            status = 500, 
            description = "Create failed", 
        )
    )
)]
#[allow(dead_code)]
pub fn create_user_preferences() {}

#[utoipa::path(
    put,
    path = "/api/user/preferences",
    request_body = NewUserPreferences,
    tag = "User Preferences",
    description = "Update user preferences",
    responses(
        (
            status = 200, 
            description = "Updated",
            body = ResponseWrapper<UserPreferences>,
        ),
        (
            status = 500, 
            description = "Create failed", 
        )
    )
)]
#[allow(dead_code)]
pub fn update_user_preferences() {}