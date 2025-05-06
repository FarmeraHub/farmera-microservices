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

#[utoipa::path(
    get,
    path = "/api/template",
    tag = "Template",
    params(
        ("order" = Option<String>, Query, description = "Order column of the template"),
        ("limit" = Option<i32>, Query, description = "Limit the number of rows"),
        ("asc" = Option<bool>, Query, description = "Ascending and descending order"),
    ),
    responses(
        (
            status = 200, 
            description = "Success operation",
            body = Vec<Template>,
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub fn get_templates() {}