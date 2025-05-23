use std::sync::Arc;

use crate::{
    errors::db_error::DBError,
    models::notification::{NewNotification, NewTemplateNotification, Notification},
    repositories::{notification_repo::NotificationRepo, template_repo::TemplateRepo},
    utils::template_utils::TemplateUtils,
};

pub struct NotificationService {
    notification_repo: Arc<NotificationRepo>,
    template_repo: Arc<TemplateRepo>,
}

impl NotificationService {
    pub fn new(notification_repo: Arc<NotificationRepo>, template_repo: Arc<TemplateRepo>) -> Self {
        Self {
            notification_repo,
            template_repo,
        }
    }

    pub async fn create_notification(
        &self,
        mut notification: NewNotification,
    ) -> Result<Notification, DBError> {
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
    ) -> Result<Option<Notification>, DBError> {
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
}
