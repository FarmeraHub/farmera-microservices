use crate::models::template::{NewTemplate, Template};

#[utoipa::path(
    get,
    path = "/api/template/{template_id}",
    params(
        ("template_id" = i32, Path, description = "ID of the template")
    ),
    tag = "Template",
    responses(
        (
            status = 200, 
            description = "Template found",
            body = Template,
        ),
        (
            status = 404, 
            description = "Template not found", 
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub fn get_template_by_id() {}

#[utoipa::path(
    post,
    path = "/api/template",
    request_body = NewTemplate,
    tag = "Template",
    responses(
        (
            status = 201, 
            description = "Created",
        ),
        (
            status = 500, 
            description = "Create failed", 
        )
    )
)]
#[allow(dead_code)]
pub fn create_template() {}