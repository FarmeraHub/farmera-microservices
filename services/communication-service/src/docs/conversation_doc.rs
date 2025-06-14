use crate::models::{conversation::{Conversation, ConversationList, ConversationMessages, NewConversation, NewPrivateConversation}, response_wrapper::{ResponseWrapper, UnitStruct}, user_conversation::UserConversation};

#[utoipa::path(
    get,
    path = "/api/conversation/{conversation_id}",
    tag = "Conversation",
    params(
        ("conversation_id" = i32, Path, description = "ID of the conversation")
    ),
    responses(
        (
            status = 200, 
            description = "Conversation found",
            body = ResponseWrapper<Conversation>,
        ),
        (
            status = 404, 
            description = "Conversation not found", 
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub async fn get_conversation_by_id() {}

#[utoipa::path(
    post,
    path = "/api/conversation",
    request_body = NewConversation,
    tag = "Conversation",
    responses(
        (
            status = 201, 
            description = "Created",
            body = ResponseWrapper<Conversation>,
        ),
        (
            status = 500, 
            description = "Create failed", 
        )
    )
)]
#[allow(dead_code)]
pub async fn create_conversation() {}

#[utoipa::path(
    delete,
    path = "/api/conversation/{conversation_id}",
    params(
        ("conversation_id" = i32, Path, description = "ID of the conversation")
    ),
    tag = "Conversation",
    responses(
        (
            status = 200, 
            description = "Deleted",
            body = ResponseWrapper<UnitStruct>
        ),
        (
            status = 500, 
            description = "Delete failed", 
        )
    )
)]
#[allow(dead_code)]
pub async fn delete_conversation() {}

#[utoipa::path(
    get,
    path = "/api/conversation/{conversation_id}/participants",
    tag = "Conversation",
    params(
        ("conversation_id" = i32, Path, description = "ID of the conversation")
    ),
    responses(
        (
            status = 200, 
            description = "Success operation",
            body = Vec<UserConversation>,
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub async fn get_conversation_participants() {}

#[utoipa::path(
    get,
    path = "/api/conversation/{conversation_id}/messages",
    tag = "Conversation",
    params(
        ("conversation_id" = i32, Path, description = "ID of the conversation"),
        ("limit" = Option<i32>, Query, description = "Limit the number of messages"),
        ("before" = Option<DateTime<Utc>>, Query, description = "Timestamp to paginate before"),
    ),
    responses(
        (
            status = 200, 
            description = "Success operation",
            body = ResponseWrapper<ConversationMessages>,
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub async fn get_conversation_messages() {}

#[utoipa::path(
    get,
    path = "/api/conversation",
    tag = "Conversation",
    params(
        ("limit" = Option<i32>, Query, description = "Limit the number of messages"),
        ("page" = Option<i32>, Query, description = "Page"),
    ),
    responses(
        (
            status = 200, 
            description = "Success operation",
            body = ResponseWrapper<ConversationList>,
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub async fn get_user_conversations() {}

#[utoipa::path(
    post,
    path = "/api/conversation/private",
    request_body = NewPrivateConversation,
    tag = "Conversation",
    responses(
        (
            status = 201, 
            description = "Created",
            body = ResponseWrapper<Conversation>,
        ),
        (
            status = 500, 
            description = "Create failed", 
        )
    )
)]
#[allow(dead_code)]
pub async fn create_private_conversation() {}