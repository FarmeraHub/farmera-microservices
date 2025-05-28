use std::{sync::Arc, time::Duration};

use chrono::{DateTime, Utc};
use rdkafka::producer::{FutureProducer, FutureRecord};

use crate::{
    errors::kafka_error::KafkaError, models::email,
    repositories::user_notification_repo::UserNotificationsRepo,
};

pub struct EmailService {
    producer: Arc<FutureProducer>,
    user_notification_repo: Arc<UserNotificationsRepo>,
}

impl EmailService {
    pub fn new(
        producer: Arc<FutureProducer>,
        user_notification_repo: Arc<UserNotificationsRepo>,
    ) -> Self {
        Self {
            producer,
            user_notification_repo,
        }
    }

    pub async fn send_email(&self, message: &email::EmailMessage) -> Result<(), KafkaError> {
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

    pub async fn handle_sendgrid_hook_event(&self, events: Vec<email::SendGridEvent>) {
        for event in &events {
            if let (Some(arg), Some(email)) = (&event.custom_args, &event.email) {
                if let Some(notification_id) = arg.get("notification_id") {
                    let notification_id = match notification_id.parse::<i64>() {
                        Ok(result) => result,
                        Err(e) => {
                            log::error!("{e}");
                            continue;
                        }
                    };

                    let datetime_utc = match DateTime::<Utc>::from_timestamp(event.timestamp, 0) {
                        Some(result) => result,
                        None => {
                            log::error!("Parsing timestamp error");
                            continue;
                        }
                    };

                    let status = match &event.status {
                        Some(status) => {
                            if status == "delivered" {
                                "sent"
                            } else {
                                "failed"
                            }
                        }
                        None => {
                            log::error!("Parsing status error");
                            continue;
                        }
                    };

                    if let Err(e) = self
                        .user_notification_repo
                        .update_status_by_recipient_and_noti_id(
                            email,
                            notification_id,
                            status,
                            Some(datetime_utc),
                        )
                        .await
                    {
                        log::error!("{e}");
                    }
                }
            }
        }
    }
}
