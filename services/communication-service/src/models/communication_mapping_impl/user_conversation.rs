use farmera_grpc_proto::communication::{GetConversationParticipantsResponse, UserConversation};

use crate::models::{common_mapping_impl::*, user_conversation::Participants};

impl From<UsrCvs> for UserConversation {
    fn from(value: UsrCvs) -> Self {
        let deleted_at = if value.deleted_at.is_none() {
            None
        } else {
            Some(datetime_to_grpc_timestamp(value.deleted_at.unwrap()))
        };

        UserConversation {
            id: value.id,
            conversation_id: value.conversation_id,
            user_id: value.user_id.to_string(),
            deleted_at: deleted_at,
        }
    }
}

impl From<Participants> for GetConversationParticipantsResponse {
    fn from(value: Participants) -> Self {
        let participants = value
            .participants
            .into_iter()
            .map(UserConversation::from)
            .collect::<Vec<UserConversation>>();

        GetConversationParticipantsResponse { participants }
    }
}
