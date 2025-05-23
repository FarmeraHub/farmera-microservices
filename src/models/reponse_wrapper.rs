use actix_web::HttpResponse;
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
pub struct UnitStruct; // Placeholder for unit struct

#[derive(Serialize, ToSchema)]
pub struct ResponseWrapper<T: Serialize + ToSchema> {
    #[schema(example = "success")]
    pub status: String,

    #[schema(example = "Operation completed successfully")]
    pub message: Option<String>,

    pub data: Option<T>,
}

impl<T: Serialize + ToSchema> ResponseWrapper<T> {
    pub fn build(
        status_code: actix_web::http::StatusCode,
        message: &str,
        data: Option<T>,
    ) -> HttpResponse {
        let status = if status_code.is_success() {
            "success"
        } else {
            "error"
        };
        HttpResponse::build(status_code).json(ResponseWrapper {
            status: status.to_string(),
            message: Some(message.to_string()),
            data: data,
        })
    }
}
