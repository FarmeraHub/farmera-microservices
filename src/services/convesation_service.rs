use std::sync::Arc;

use crate::{
    errors::{api_error::APIError, Error},
    models::conversation::Conversation,
    repositories::conversation_repo::ConversationRepo,
};

pub struct ConversationService {
    conversation_repo: Arc<ConversationRepo>,
}

impl ConversationService {
    pub fn new(conversation_repo: Arc<ConversationRepo>) -> Self {
        Self { conversation_repo }
    }

    pub async fn get_conversation_by_id(&self, id: i32) -> Result<Conversation, Error> {
        // query database
        let conversation = self.conversation_repo.find_conversation_by_id(id).await?;

        // return result if exist, error if not found
        match conversation {
            Some(result) => Ok(result),
            None => Err(Error::Api(APIError::NotFound(
                "Conversation not found".to_string(),
            ))),
        }
    }
}
