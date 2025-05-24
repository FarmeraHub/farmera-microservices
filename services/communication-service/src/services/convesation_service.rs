use std::sync::Arc;

use chrono::{DateTime, Utc};

use crate::{
    errors::db_error::DBError,
    models::{conversation::Conversation, message::Message, user_conversation::UserConversation},
    repositories::conversation_repo::ConversationRepo,
};

pub struct ConversationService {
    conversation_repo: Arc<ConversationRepo>,
}

impl ConversationService {
    pub fn new(conversation_repo: Arc<ConversationRepo>) -> Self {
        Self { conversation_repo }
    }

    pub async fn _get_conversation(&self) {
        todo!()
    }

    pub async fn get_conversation_by_id(&self, id: i32) -> Result<Option<Conversation>, DBError> {
        self.conversation_repo.find_conversation_by_id(id).await
    }

    pub async fn create_conversation(&self, title: &str) -> Result<i32, DBError> {
        self.conversation_repo.insert_conversation(title).await
    }

    pub async fn delete_conversation(&self, conversation_id: i32) -> Result<u64, DBError> {
        self.conversation_repo
            .delete_conversation(conversation_id)
            .await
    }

    pub async fn get_conversation_participants(
        &self,
        conversation_id: i32,
    ) -> Result<Vec<UserConversation>, DBError> {
        self.conversation_repo
            .find_users_by_conversation_id(conversation_id)
            .await
    }

    pub async fn get_conversation_messages(
        &self,
        conversation_id: i32,
        limit: Option<i32>,
        before: Option<DateTime<Utc>>,
    ) -> Result<Vec<Message>, DBError> {
        self.conversation_repo
            .get_messages_by_conversation_id(conversation_id, limit, before)
            .await
    }
}
