use utoipa::OpenApi;

use crate::docs::{attachment_doc, conversation_doc, message_doc};

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

        attachment_doc::upload_file,
        attachment_doc::get_file,
        attachment_doc::get_attachment_by_id,
        attachment_doc::get_attachments_by_conversation_id,
        attachment_doc::get_attachments_by_message_id,
    ),
    tags(
        (name = "Message", description = "Message operations, only for testing"),
        (name = "Conversation", description = "Conversation operations"),
        (name = "Attachment", description = "Attachment operations"),
    )
)]
pub struct ApiDoc;
