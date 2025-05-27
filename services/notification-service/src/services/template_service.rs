use std::sync::Arc;

use crate::{
    errors::db_error::DBError,
    models::template::{NewTemplate, Template},
    repositories::template_repo::TemplateRepo,
};

pub struct TemplateService {
    template_repo: Arc<TemplateRepo>,
}

impl TemplateService {
    pub fn new(template_repo: Arc<TemplateRepo>) -> Self {
        Self { template_repo }
    }

    pub async fn get_template_by_id(&self, template_id: i32) -> Result<Option<Template>, DBError> {
        self.template_repo.get_template_by_id(template_id).await
    }

    pub async fn create_template(&self, template: &NewTemplate) -> Result<Template, DBError> {
        self.template_repo
            .insert_template(&template.name, &template.content)
            .await
    }

    pub async fn get_templates(
        &self,
        order: &str,
        limit: i32,
        is_asc: bool,
    ) -> Result<Vec<Template>, DBError> {
        self.template_repo.get_templates(order, limit, is_asc).await
    }
}
