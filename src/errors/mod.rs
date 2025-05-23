pub mod db_error;
pub mod jwt_error;
pub mod kafka_error;
pub mod sending_error;

use actix_web::{HttpResponse, ResponseError, http::StatusCode};

use db_error::DBError;
use kafka_error::KafkaError;
use thiserror::Error;

use crate::models::reponse_wrapper::ResponseWrapper;

#[derive(Debug, Error)]
pub enum Error {
    #[error(transparent)]
    Db(#[from] DBError),

    #[error(transparent)]
    Kafka(#[from] KafkaError),
}

impl ResponseError for Error {
    fn error_response(&self) -> HttpResponse {
        fn json_error(status: StatusCode, message: &str) -> HttpResponse {
            ResponseWrapper::<()>::build(status, message, None)
        }

        match self {
            Error::Db(DBError::QueryError(_)) => {
                json_error(StatusCode::INTERNAL_SERVER_ERROR, "Database query error")
            }
            Error::Db(DBError::QueryFailed(e)) => json_error(StatusCode::INTERNAL_SERVER_ERROR, e),
            Error::Db(DBError::NotFound(e)) => json_error(StatusCode::NOT_FOUND, e),
            Error::Kafka(KafkaError::Error(_)) => {
                json_error(StatusCode::INTERNAL_SERVER_ERROR, "Kafka error")
            }
        }
    }
}
