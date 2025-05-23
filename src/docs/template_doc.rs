use crate::models::{reponse_wrapper::ResponseWrapper, template::{NewTemplate, Template}};

#[utoipa::path(
    get,
    path = "/api/template/{template_id}",
    params(
        ("template_id" = i32, Path, description = "ID of the template")
    ),
    tag = "Template",
    description = "Retrieve a specific notification template by its unique ID",
    responses(
        (
            status = 200, 
            description = "Template found",
            body = ResponseWrapper<Template>,
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
    description = "Create a new notification template that can be reused with dynamic content",
    responses(
        (
            status = 201, 
            description = "Created",
            body = ResponseWrapper<Template>,
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
    description = "Retrieve a list of all notification templates, with optional sorting and pagination",
    params(
        ("order" = Option<String>, Query, description = "Order column of the template"),
        ("limit" = Option<i32>, Query, description = "Limit the number of rows"),
        ("asc" = Option<bool>, Query, description = "Ascending and descending order"),
    ),
    responses(
        (
            status = 200, 
            description = "Success operation",
            body = ResponseWrapper<Vec<Template>>,
        ),
        (
            status = 500, 
            description = "Database error", 
        )
    )
)]
#[allow(dead_code)]
pub fn get_templates() {}