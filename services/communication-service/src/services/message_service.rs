use std::sync::Arc;

use crate::{
    errors::db_error::DBError,
    models::message::Message,
    repositories::{attachment_repo::AttachmentRepo, message_repo::MessageRepo},
};

pub struct MessageService {
    message_repo: Arc<MessageRepo>,
    attachment_repo: Arc<AttachmentRepo>,
}

impl MessageService {
    pub fn new(message_repo: Arc<MessageRepo>, attachment_repo: Arc<AttachmentRepo>) -> Self {
        Self {
            message_repo,
            attachment_repo,
        }
    }

    pub async fn get_message_by_id(&self, message_id: i64) -> Result<Option<Message>, DBError> {
        self.message_repo.find_message_by_id(message_id).await
    }

    pub async fn delete_message(&self, message_id: i64) -> Result<(), DBError> {
        let _ = self.message_repo.delete_message(message_id).await;
        let _ = self
            .attachment_repo
            .delete_attachment_by_message_id(message_id)
            .await;
        Ok(())
    }
}
