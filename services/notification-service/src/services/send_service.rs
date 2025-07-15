use std::{collections::HashSet, sync::Arc};

use crate::{
    errors::{Error, db_error::DBError},
    models::{
        Channel, NotificationType, email, notification::SendNotification, push,
        user_preferences::UserPreferences,
    },
};

use super::{
    email_service::EmailService, push_service::PushService,
    user_devices_service::UserDeviceService, user_preferences_service::UserPreferencesService,
};

pub struct SendService {
    user_preferences_service: Arc<UserPreferencesService>,
    user_devices_service: Arc<UserDeviceService>,
    pub email_service: Arc<EmailService>,
    pub push_service: Arc<PushService>,
}

impl SendService {
    pub fn new(
        user_preferences_service: Arc<UserPreferencesService>,
        user_devices_service: Arc<UserDeviceService>,
        email_service: Arc<EmailService>,
        push_service: Arc<PushService>,
    ) -> Self {
        Self {
            user_preferences_service,
            user_devices_service,
            email_service,
            push_service,
        }
    }

    pub async fn send(
        &self,
        send_notification: &SendNotification,
    ) -> Result<Option<String>, Error> {
        if send_notification.recipent.is_some() {
            // Send to specific user
            self.send_to_specific_user(send_notification).await
        } else {
            // Send to all users
            Ok(None)
        }
    }

    async fn send_to_specific_user(
        &self,
        send_notification: &SendNotification,
    ) -> Result<Option<String>, Error> {
        // Get user preferences
        let user_preferences = match self
            .user_preferences_service
            .get_user_preferences_by_user_id(send_notification.recipent.unwrap())
            .await
            .map_err(|e| {
                log::error!("Get user preferences error: {e}");
                Error::Db(e)
            })? {
            Some(user_preferences) => user_preferences,
            None => {
                return Err(Error::Db(DBError::NotFound(
                    "User preferences not found".to_string(),
                )));
            }
        };

        // Get user timezone
        let tz = user_preferences
            .time_zone
            .parse::<chrono_tz::Tz>()
            .map_err(|e| {
                log::error!("Parse timezone error: {e}");
                Error::InternalServerError
            })?;
        // Get current time
        let now = chrono::Utc::now().with_timezone(&tz).time();

        // Check if user is in do not disturb mode
        if let (Some(start), Some(end)) = (
            &user_preferences.do_not_disturb_start,
            &user_preferences.do_not_disturb_end,
        ) {
            if now >= *start && now <= *end {
                // !TODO: Resend notification after do not disturb period
                return Ok(Some(
                    "User is in do not disturb mode, notificatio will be sent later".to_string(),
                ));
            }
        }

        // Get intersection of user channels and requested channels
        let user_channels = match &send_notification.notification_type {
            NotificationType::Transactional => user_preferences.transactional_channels.clone(),
            NotificationType::SystemAlert => user_preferences.system_alert_channels.clone(),
            NotificationType::Chat => user_preferences.chat_channels.clone(),
        };

        let user_set: HashSet<Channel> = user_channels.into_iter().collect();
        let request_set: HashSet<Channel> =
            send_notification.channels.clone().into_iter().collect();
        let intersection_set: HashSet<Channel> =
            request_set.intersection(&user_set).cloned().collect();

        // Check if there is no intersection
        if intersection_set.is_empty() {
            return Err(Error::Db(DBError::NotFound(
                "No intersection between user channels and requested channels".to_string(),
            )));
        }

        // Send notification to user
        for channel in intersection_set {
            let notification = send_notification.clone();
            match channel {
                Channel::Email => {
                    // Put email message to Kafka
                    self.send_email(notification, &user_preferences).await?;
                }
                Channel::Push => {
                    // Put push message to Kafka
                    self.send_push(notification).await?;
                }
            }
        }
        Ok(None)
    }

    async fn send_email(
        &self,
        send_notification: SendNotification,
        user_preferences: &UserPreferences,
    ) -> Result<(), Error> {
        let send_email = email::EmailMessage {
            to: [email::Email {
                email: user_preferences.user_email.clone(),
                name: None,
            }]
            .to_vec(),
            from: send_notification.from,
            template_id: send_notification.template_id,
            template_props: send_notification.template_props,
            subject: send_notification.title,
            content: send_notification.content,
            content_type: send_notification.content_type,
            attachments: send_notification.attachments,
            reply_to: send_notification.reply_to,
            id: send_notification.id,
            retry_count: send_notification.retry_count,
            retry_ids: send_notification.retry_ids,
        };
        // Put email message to Kafka
        match self.email_service.send_email(&send_email).await {
            Ok(()) => Ok(()),
            Err(e) => Err(Error::Kafka(e)),
        }
    }

    async fn send_push(&self, send_notification: SendNotification) -> Result<(), Error> {
        // Get user device tokens
        let user_devices = match self
            .user_devices_service
            .get_user_device_token(send_notification.recipent.unwrap())
            .await
        {
            Ok(user_devices) => user_devices,
            Err(e) => {
                log::error!("Get user devices error: {e}");
                return Err(Error::Db(e));
            }
        };

        let send_push = push::PushMessage {
            recipient: user_devices,
            r#type: push::PushMessageType::Token,
            template_id: send_notification.template_id,
            template_props: send_notification.template_props,
            title: send_notification.title,
            content: send_notification.content,
            notification_type: send_notification.notification_type,
            retry_count: send_notification.retry_count,
            retry_ids: send_notification.retry_ids,
        };

        // Put push message to Kafka
        match self.push_service.send_push(&send_push).await {
            Ok(()) => Ok(()),
            Err(e) => Err(Error::Kafka(e)),
        }
    }
}
