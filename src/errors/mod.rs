pub mod db_error;
pub mod jwt_error;
pub mod kafka_error;
pub mod sending_error;

use actix_web::{HttpResponse, ResponseError};

use db_error::DBError;
use kafka_error::KafkaError;
use thiserror::Error;

use crate::models::reponse::Response;

#[derive(Debug, Error)]
pub enum Error {
    #[error(transparent)]
    Db(#[from] DBError),

    #[error(transparent)]
    Kafka(#[from] KafkaError),
}

impl ResponseError for Error {
    fn error_response(&self) -> actix_web::HttpResponse<actix_web::body::BoxBody> {
        match self {
            Error::Db(e) => match e {
                DBError::QueryError(_) => HttpResponse::InternalServerError().json(Response {
                    r#type: "error".to_string(),
                    message: "Database query error".to_string(),
                }),
                DBError::QueryFailed(e) => HttpResponse::InternalServerError().json(Response {
                    r#type: "error".to_string(),
                    message: e.to_string(),
                }),
            },
            Error::Kafka(e) => match e {
                KafkaError::Error(_e) => HttpResponse::InternalServerError().json(Response {
                    r#type: "error".to_string(),
                    message: "Kafka error".to_string(),
                }),
            },
        }
    }
}
