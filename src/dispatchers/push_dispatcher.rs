use std::{collections::HashMap, env, sync::Arc, time::Duration};

use async_trait::async_trait;
use rdkafka::producer::{FutureProducer, FutureRecord};

use crate::{
    errors::sending_error::SendingError,
    models::{notification::NewNotification, push},
    repositories::{
        notification_repo::NotificationRepo, template_repo::TemplateRepo,
        user_notification_repo::UserNotificationsRepo,
    },
    utils::{fcm_token_manager::TokenManager, template_utils::TemplateUtils},
};

use super::Dispatcher;

pub struct PushDispatcher {
    client: reqwest::Client,
    url: String,
    token_manager: Arc<TokenManager>,
    notification_repo: Arc<NotificationRepo>,
    user_notification_repo: Arc<UserNotificationsRepo>,
    template_repo: Arc<TemplateRepo>,
    producer: Arc<FutureProducer>,
}

impl PushDispatcher {
    pub async fn new(
        token_manager: Arc<TokenManager>,
        notification_repo: Arc<NotificationRepo>,
        user_notification_repo: Arc<UserNotificationsRepo>,
        template_repo: Arc<TemplateRepo>,
        producer: Arc<FutureProducer>,
    ) -> Self {
        let project_id = env::var("FCM_PROJECT_ID").expect("FCM_PROJECT_ID must be set");
        Self {
            client: reqwest::Client::new(),
            url: format!(
                "https://fcm.googleapis.com/v1/projects/{}/messages:send",
                project_id
            ),
            token_manager,
            notification_repo,
            user_notification_repo,
            template_repo,
            producer,
        }
    }

    async fn try_send(
        &self,
        token: &str,
        message: &serde_json::Value,
    ) -> Result<reqwest::Response, reqwest::Error> {
        self.client
            .post(&self.url)
            .bearer_auth(token)
            .body(message.to_string())
            .send()
            .await
    }

    async fn retry(&self, mut message: push::PushMessage) -> Result<(), SendingError> {
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
                FutureRecord::to("push").payload(message).key("key"),
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
impl Dispatcher for PushDispatcher {
    async fn send(&self, msg: &str) -> Result<(), SendingError> {
        // Parse the notification payload into model
        let mut payload = serde_json::from_str::<push::PushMessage>(&msg).map_err(|e| {
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

        let new_notification = NewNotification {
            template_id,
            title: payload.title.clone(),
            content: content.clone(),
            channel: "push".to_string(),
        };

        let mut inserted = HashMap::new();

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

            let recipient_num = if payload.r#type == "token".to_string() {
                payload.recipient.len()
            } else {
                0
            };

            // insert user_notification
            for i in 0..recipient_num {
                let result = self
                    .user_notification_repo
                    .insert_user_notification(
                        &payload.recipient[i],
                        notification_id,
                        "pending",
                        None,
                    )
                    .await
                    .map_err(|e| SendingError::DatabaseError(e.to_string()))?;
                inserted.insert(payload.recipient[i].clone(), result);
            }

            // commit transaction
            tx.commit()
                .await
                .map_err(|e| SendingError::DatabaseError(e.to_string()))?;

            payload.retry_ids = inserted.clone();
        } else {
            inserted = payload.retry_ids.clone();
        }

        for (recipent, id) in &inserted {
            // construct the FCM request message
            let message = serde_json::json!({
                "message": {
                    payload.r#type.clone(): recipent,
                    "notification": {
                        "title": payload.title.clone(),
                        "body": content
                    }
                }
            });

            // Try sending the request, and retry once if unauthorized (401)
            for _t in 0..1 {
                let token = match self.token_manager.get_token() {
                    Some(token) => token,
                    None => {
                        log::error!("Empty token");
                        return Err(SendingError::NoneValue("Empty token".to_string()));
                    }
                };

                // Attempt to send the notification
                match self.try_send(token.as_str(), &message).await {
                    Ok(response) => {
                        // info!("FCM response: {:?}", response);
                        if response.status() == reqwest::StatusCode::UNAUTHORIZED {
                            // Token expired, attempt to refresh
                            log::warn!("Token expired, refreshing token...");
                            self.token_manager.update_token().await;
                            continue;
                        } else if response.status().is_success() {
                            // Successfully sent notification, update database status
                            let result = self
                                .user_notification_repo
                                .update_user_notification_status(
                                    *id,
                                    "sent",
                                    Some(chrono::Utc::now()),
                                )
                                .await
                                .map_err(|e| {
                                    log::error!("Update error: {}", e);
                                    SendingError::DatabaseError(e.to_string())
                                })?;
                            log::debug!("Update row affected: {}", result);
                            return Ok(());
                        } else {
                            // Failed to send notification
                            if let Err(sending_err) = self.retry(payload.clone()).await {
                                log::error!("{}", sending_err);
                                if let Err(e) = self
                                    .user_notification_repo
                                    .update_user_notification_status(*id, "failed", None)
                                    .await
                                {
                                    log::error!("Update status error: {e}");
                                }
                            }
                            return Err(SendingError::RequestFailed);
                        }
                    }
                    Err(e) => {
                        log::error!("Can not send request: {}", e);
                        return Err(SendingError::RequestError(e));
                    }
                };
            }
        }

        log::error!("Can not send request");
        Err(SendingError::RequestFailed)
    }
}
