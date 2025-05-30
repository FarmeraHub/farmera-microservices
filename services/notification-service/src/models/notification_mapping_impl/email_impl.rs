use std::collections::HashMap;

use farmera_grpc_proto::notification::SendEmailNotificationRequest;

use crate::models::email::EmailMessage;

use super::{SAttachment, SEmail, convert_string_map_to_hash_map};

// Convert SendEmailNotificationRequest to EmailMessage
impl TryFrom<SendEmailNotificationRequest> for EmailMessage {
    type Error = &'static str;

    fn try_from(value: SendEmailNotificationRequest) -> Result<Self, Self::Error> {
        if value.subject.is_empty() {
            return Err("subject cannot be empty");
        }
        let content_type = if value.content_type.is_empty() {
            "text/plain".to_string()
        } else {
            value.content_type
        };

        // Convert to (Vec<Email>)
        let to = value
            .to
            .into_iter()
            .map(SEmail::try_from)
            .collect::<Result<Vec<SEmail>, &'static str>>()?;

        if to.is_empty() {
            return Err("At least one recipient is required");
        }

        let from = SEmail::try_from(value.from.ok_or("From email is required")?)?;

        // Convert Option<NotificationAttachmentList> to Option<Vec<Attachments>>
        let attachments = value
            .attachments
            .map(|list| {
                list.attachments
                    .into_iter()
                    .map(SAttachment::try_from)
                    .collect::<Result<Vec<SAttachment>, &'static str>>()
            })
            .transpose()?;

        let reply_to = value.reply_to.map(SEmail::try_from).transpose()?;

        Ok(EmailMessage {
            to: to,
            from: from,
            template_id: value.template_id,
            template_props: convert_string_map_to_hash_map(value.template_props),
            subject: value.subject,
            content: value.content,
            content_type: content_type,
            attachments: attachments,
            reply_to: reply_to,
            retry_count: u8::default(),
            retry_ids: HashMap::default(),
            id: i64::default(),
        })
    }
}
