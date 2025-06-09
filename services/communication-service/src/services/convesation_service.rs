use std::sync::Arc;

use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::{
    errors::db_error::DBError,
    models::{
        conversation::{Conversation, ConversationList, ConversationMessages},
        user_conversation::Participants,
        Pagination,
    },
    repositories::conversation_repo::ConversationRepo,
};

pub struct ConversationService {
    conversation_repo: Arc<ConversationRepo>,
}

impl ConversationService {
    pub fn new(conversation_repo: Arc<ConversationRepo>) -> Self {
        Self { conversation_repo }
    }

    pub async fn get_conversation_by_id(
        &self,
        conversation_id: i32,
    ) -> Result<Option<Conversation>, DBError> {
        self.conversation_repo
            .find_conversation_by_id(conversation_id)
            .await
    }

    pub async fn create_conversation(&self, title: &str) -> Result<Conversation, DBError> {
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
    ) -> Result<Participants, DBError> {
        let participants = self
            .conversation_repo
            .find_users_by_conversation_id(conversation_id)
            .await?;
        Ok(Participants { participants })
    }

    pub async fn get_conversation_messages(
        &self,
        conversation_id: i32,
        limit: Option<i32>,
        before: Option<DateTime<Utc>>,
    ) -> Result<ConversationMessages, DBError> {
        let messages = self
            .conversation_repo
            .get_messages_by_conversation_id(conversation_id, limit, before)
            .await?;
        Ok(ConversationMessages { messages })
    }

    pub async fn get_user_conversation(
        &self,
        user_id: Uuid,
        pagination: Pagination,
    ) -> Result<ConversationList, DBError> {
        let limit = pagination.limit.unwrap_or_default();
        let offset = (pagination.page.unwrap_or_default() - 1) * limit;

        let conversations = self
            .conversation_repo
            .get_conversation_by_user_id(user_id, limit, offset)
            .await?;
        Ok(ConversationList { conversations })
    }

    pub async fn create_private_conversation(
        &self,
        title: &str,
        user_a: Uuid,
        user_b: Uuid,
    ) -> Result<Conversation, DBError> {
        self.conversation_repo
            .insert_private_conversation(&title, user_a, user_b)
            .await
    }
}
