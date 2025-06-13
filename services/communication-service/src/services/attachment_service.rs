use std::sync::Arc;

use actix_files::NamedFile;
use chrono::Utc;
use uuid::Uuid;

use crate::{
    errors::{db_error::DBError, file_error::FileError, Error},
    models::{
        attachment::{Attachment, MediaContent},
        upload_form::UploadForm,
        MessageType,
    },
    repositories::{attachment_repo::AttachmentRepo, message_repo::MessageRepo},
};

const MAXSIZE: usize = 20 * 1024 * 1024; // file max size - 20MB
const MEDIA_TYPE: [&str; 4] = ["text", "video", "image", "audio"]; // valid file types

pub struct AttachmentService {
    attachment_repo: Arc<AttachmentRepo>,
    message_repo: Arc<MessageRepo>,
}

impl AttachmentService {
    pub fn new(attachment_repo: Arc<AttachmentRepo>, message_repo: Arc<MessageRepo>) -> Self {
        // create top level media type upload folder
        for file_type in MEDIA_TYPE {
            std::fs::create_dir_all(format!("./uploads/{}", file_type)).unwrap();
        }

        Self {
            attachment_repo,
            message_repo,
        }
    }

    pub async fn upload_file(
        &self,
        form: UploadForm,
        conversation_id: i32,
        sender_id: Uuid,
    ) -> Result<Vec<MediaContent>, Error> {
        let mut result: Vec<MediaContent> = vec![];
        let timestamp = Utc::now();

        // loop through all tempfiles and process them
        for f in form.files {
            if let (Some(file_name), Some(content_type)) = (f.file_name, f.content_type) {
                if f.size > MAXSIZE {
                    return Err(FileError::FileTooLarge(file_name).into());
                }

                // !TODO: compress file if too large

                let file_type = content_type.type_().to_string();

                let path = format!(
                    "./uploads/{}/{}-{}",
                    file_type,
                    timestamp.timestamp(),
                    file_name
                );

                // persist the temporary file at the target path
                f.file
                    .persist(&path)
                    .map_err(|_| FileError::InvalidFile("Invalid file type".to_string()))?;

                let relative_path = path.trim_start_matches("./");

                result.push(MediaContent {
                    url: relative_path.to_string(),
                    size: f.size as i32,
                    r#type: file_type.to_string(),
                });
            } else {
                return Err(FileError::InvalidContentType.into());
            }
        }

        // save meatadata to database
        if !result.is_empty() {
            let message_id = self
                .message_repo
                .insert_message(
                    conversation_id,
                    sender_id,
                    None,
                    MessageType::Media,
                    timestamp,
                    false,
                )
                .await?;
            let _ = self
                .attachment_repo
                .bulk_insert_attachments(Some(message_id), Some(conversation_id), &result)
                .await?;
        } else {
            return Err(FileError::InvalidFile("Empty body".to_string()).into());
        }

        Ok(result)
    }

    pub async fn get_file_by_url(&self, attachment_path: &str) -> Result<NamedFile, Error> {
        let path = format!("./{}", attachment_path);
        return Ok(NamedFile::open(path).map_err(|e| FileError::OpenError(e.to_string()))?);
    }

    pub async fn get_attachment_by_id(
        &self,
        attachment_id: i32,
    ) -> Result<Option<Attachment>, DBError> {
        self.attachment_repo
            .get_attachment_by_id(attachment_id)
            .await
    }

    pub async fn get_attachments_by_conversation_id(
        &self,
        conversation_id: i32,
        before: Option<chrono::DateTime<Utc>>,
        limit: Option<i32>,
    ) -> Result<Vec<Attachment>, DBError> {
        self.attachment_repo
            .get_attachments_by_conversation_id(conversation_id, before, limit)
            .await
    }

    pub async fn get_attachment_by_message_id(
        &self,
        message_id: i64,
    ) -> Result<Vec<Attachment>, DBError> {
        self.attachment_repo
            .get_attachment_by_message_id(message_id)
            .await
    }
}
