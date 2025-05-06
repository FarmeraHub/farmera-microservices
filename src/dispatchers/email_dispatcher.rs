use std::{collections::HashMap, env, sync::Arc, time::Duration};

use async_trait::async_trait;
use rdkafka::producer::{FutureProducer, FutureRecord};

use crate::{
    errors::sending_error::SendingError,
    models::{email, notification::NewNotification},
    repositories::{notification_repo::NotificationRepo, template_repo::TemplateRepo},
    utils::template_utils::TemplateUtils,
};

use super::Dispatcher;

pub struct EmailDispatcher {
    client: reqwest::Client,
    url: String,
    api_key: String,
    notification_repo: Arc<NotificationRepo>,
    template_repo: Arc<TemplateRepo>,
    producer: Arc<FutureProducer>,
}

impl EmailDispatcher {
    pub fn new(
        notification_repo: Arc<NotificationRepo>,
        template_repo: Arc<TemplateRepo>,
        producer: Arc<FutureProducer>,
    ) -> Self {
        let api_key = env::var("SENDGRID_API_KEY").expect("SENDGRID_API_KEY must be set");

        Self {
            client: reqwest::Client::new(),
            url: format!("https://api.sendgrid.com/v3/mail/send"),
            api_key,
            notification_repo,
            template_repo,
            producer,
        }
    }

    async fn try_send(
        &self,
        message: &serde_json::Value,
    ) -> Result<reqwest::Response, reqwest::Error> {
        self.client
            .post(&self.url)
            .bearer_auth(&self.api_key)
            .header("Content-Type", "application/json")
            .body(message.to_string())
            .send()
            .await
    }

    async fn retry(&self, mut message: email::EmailMessage) -> Result<(), SendingError> {
        message.retry_count += 1;
        log::warn!("Retrying job (attempt {}/3)...", message.retry_count);
        if message.retry_count >= 3 {
            return Err(SendingError::RetryError(
                "Failed too many times, updating failed status...".to_string(),
            ));
        }
        let message = &serde_json::to_string(&message).unwrap();
        let _status = self
            .producer
            .send(
                FutureRecord::to("email").payload(message).key("key"),
                Duration::from_secs(0),
            )
            .await
            .map_err(|e| {
                log::error!("{}", e.0);
                SendingError::RetryError(e.0.to_string())
            })?;

        Ok(())
    }
}

#[async_trait]
impl Dispatcher for EmailDispatcher {
    async fn send(&self, msg: &str) -> Result<(), SendingError> {
        let mut payload = serde_json::from_str::<email::EmailMessage>(&msg).map_err(|e| {
            log::error!("Invalid data type: {}", e);
            SendingError::JsonParseError
        })?;

        let mut template_id = None;

        let content = if let Some(id) = payload.template_id {
            // !TODO: cache
            match self.template_repo.get_template_by_id(id).await {
                Ok(Some(template)) => {
                    template_id = Some(id);
                    TemplateUtils::generate_template_body(
                        &template.content,
                        &payload.template_props.clone().unwrap_or_default(),
                    )
                }
                _ => {
                    return Err(SendingError::NoneValue(
                        "Can not fetch template".to_string(),
                    ));
                }
            }
        } else {
            payload.content.clone().unwrap_or_default()
        };

        if content.is_empty() {
            return Err(SendingError::NoneValue("Empty content".to_string()));
        }

        let new_notification = NewNotification {
            template_id,
            title: payload.subject.clone(),
            content: content.clone(),
            channel: "email".to_string(),
        };

        let mut inserted = HashMap::new();

        // only insert once
        if payload.retry_count == 0 {
            // begin transaction
            let tx = self
                .notification_repo
                .pg_pool
                .begin()
                .await
                .map_err(|e| SendingError::DatabaseError(e.to_string()))?;

            // insert notification
            let notification_id = self
                .notification_repo
                .insert_notification(&new_notification)
                .await
                .map_err(|e| SendingError::DatabaseError(e.to_string()))?;

            // insert user_notification
            for email in &payload.to {
                let result = self
                    .notification_repo
                    .insert_user_notification(&email.email, notification_id, "pending", None)
                    .await
                    .map_err(|e| SendingError::DatabaseError(e.to_string()))?;
                inserted.insert(email.email.clone(), result);
            }

            // commit transaction
            tx.commit()
                .await
                .map_err(|e| SendingError::DatabaseError(e.to_string()))?;

            payload.retry_ids = inserted.clone();
        } else {
            inserted = payload.retry_ids.clone();
        }

        // construct the email request message
        let mut message = serde_json::json!({
            "personalizations": [{
                "to": payload.to
            }],
            "from": payload.from,
            "subject": payload.subject,
            "content": [{
                "type": payload.content_type,
                "value": content
            }]
        });

        if let Some(atts) = payload.attachments.clone() {
            if atts.len() > 0 {
                message["attachments"] = serde_json::json!(atts);
            }
        }

        if let Some(rep) = payload.reply_to.clone() {
            message["reply_to"] = serde_json::json!(rep);
        }

        log::info!("{}", message);

        // Attempt to send the notification
        match self.try_send(&message).await {
            Ok(response) => {
                log::info!("SendGrid response: {:?}", response);
                if response.status().is_success() {
                    return Ok(());
                } else {
                    if let Err(sending_err) = self.retry(payload.clone()).await {
                        log::error!("{}", sending_err);
                        for (_email, id) in &inserted {
                            if let Err(e) = self
                                .notification_repo
                                .update_user_notification_status(*id, "failed", None)
                                .await
                            {
                                log::error!("Update status error: {e}");
                            }
                        }
                    }
                    // Failed to send notification
                    return Err(SendingError::RequestFailed);
                }
            }
            Err(e) => {
                log::error!("Can not send request: {}", e);
                return Err(SendingError::RequestError(e));
            }
        }
    }
}
