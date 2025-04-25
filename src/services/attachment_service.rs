use std::sync::Arc;

use chrono::Utc;
use uuid::Uuid;

use crate::{
    errors::file_error::FileError,
    models::{attachment::MediaContent, upload_form::UploadForm},
    repositories::{attachment_repo::AttachmentRepo, message_repo::MessageRepo},
};

const MAXSIZE: usize = 20971520; // file max size - 20MB
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

    pub async fn upload_attachment(
        &self,
        form: UploadForm,
        conversation_id: i32,
        sender_id: Uuid,
    ) -> Result<Vec<MediaContent>, Box<dyn std::error::Error>> {
        let mut result: Vec<MediaContent> = vec![];
        let timestamp = Utc::now();

        // loop through all tempfiles and process them
        for f in form.files {
            if let (Some(file_name), Some(content_type)) = (f.file_name, f.content_type) {
                if f.size > MAXSIZE {
                    return Err(Box::new(FileError::FileTooLarge(file_name)));
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
                    .map_err(|e| Box::new(FileError::PersistError(e.to_string())))?;

                let relative_path = path.trim_start_matches("./");

                result.push(MediaContent {
                    url: relative_path.to_string(),
                    size: f.size as i32,
                    r#type: file_type.to_string(),
                });
            } else {
                return Err(Box::new(FileError::InvalidContentType));
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
                    "media".to_string(),
                    timestamp,
                    false,
                )
                .await?;
            let _ = self
                .attachment_repo
                .bulk_insert_attachments(Some(message_id), &result)
                .await?;
        }

        Ok(result)
    }
}
