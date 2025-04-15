use std::sync::Arc;

use crate::{
    errors::db_error::DBError, models::message::Message, repositories::message_repo::MessageRepo,
};

pub struct MessageService {
    message_repo: Arc<MessageRepo>,
}

impl MessageService {
    pub fn new(message_repo: Arc<MessageRepo>) -> Self {
        Self { message_repo }
    }

    pub async fn get_message_by_id(&self, message_id: i64) -> Result<Option<Message>, DBError> {
        self.message_repo.find_message_by_id(message_id).await
    }

    pub async fn delete_message(&self, message_id: i64) -> Result<u64, DBError> {
        self.message_repo.delete_message(message_id).await
    }
}
