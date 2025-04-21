use utoipa::OpenApi;

use crate::docs::{conversation_doc, message_doc};

#[derive(OpenApi)]
#[openapi(
    paths(
        message_doc::get_message_by_id,
        message_doc::delete_message,
        conversation_doc::get_conversation_by_id,
        conversation_doc::create_conversation,
        conversation_doc::delete_conversation,
        conversation_doc::get_conversation_participants,
        conversation_doc::get_conversation_messages,
    ),
    tags(
        (name = "Message", description = "Message operations"),
        (name = "Conversation", description = "Conversation operations")
    )
)]
pub struct ApiDoc;
