use std::{sync::Arc, time::Duration};

use rdkafka::producer::{FutureProducer, FutureRecord};

use crate::{
    errors::{db_error::DBError, kafka_error::KafkaError},
    models::{
        email,
        notification::{NewNotification, NewTemplateNotification, Notification},
        push,
    },
    repositories::{notification_repo::NotificationRepo, template_repo::TemplateRepo},
    utils::template_utils::TemplateUtils,
};

pub struct NotificationService {
    notification_repo: Arc<NotificationRepo>,
    template_repo: Arc<TemplateRepo>,
    producer: Arc<FutureProducer>,
}

impl NotificationService {
    pub fn new(
        notification_repo: Arc<NotificationRepo>,
        template_repo: Arc<TemplateRepo>,
        producer: Arc<FutureProducer>,
    ) -> Self {
        Self {
            notification_repo,
            template_repo,
            producer,
        }
    }

    pub async fn create_notification(
        &self,
        mut notification: NewNotification,
    ) -> Result<i64, DBError> {
        if notification.template_id.is_some() {
            notification.template_id = None;
        }
        self.notification_repo
            .insert_notification(&notification)
            .await
    }

    pub async fn create_template_notification(
        &self,
        notification: NewTemplateNotification,
    ) -> Result<Option<i64>, DBError> {
        if let Some(template) = self
            .template_repo
            .get_template_by_id(notification.template_id)
            .await?
        {
            let content =
                TemplateUtils::generate_template_body(&template.content, &notification.props);
            let result = self
                .notification_repo
                .insert_notification(&NewNotification {
                    template_id: Some(notification.template_id),
                    title: notification.title,
                    content,
                    channel: notification.channel,
                })
                .await?;
            return Ok(Some(result));
        }
        Ok(None)
    }

    pub async fn send_push(&self, message: push::PushMessage) -> Result<(), KafkaError> {
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
                KafkaError::Error(e.0)
            })?;

        Ok(())
    }

    pub async fn get_notifications(
        &self,
        order: &str,
        limit: i32,
        is_asc: bool,
    ) -> Result<Vec<Notification>, DBError> {
        self.notification_repo
            .get_notifications(order, limit, is_asc)
            .await
    }

    pub async fn send_email(&self, message: email::EmailMessage) -> Result<(), KafkaError> {
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
                KafkaError::Error(e.0)
            })?;

        Ok(())
    }
}
