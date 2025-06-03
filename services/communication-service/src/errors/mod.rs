use actix_web::{http::StatusCode, HttpResponse, ResponseError};
use thiserror::Error;

pub mod chat_error;
pub mod db_error;
pub mod file_error;
pub mod redis_error;

use db_error::DBError;
use file_error::FileError;

use crate::models::response_wrapper::ResponseWrapper;

#[derive(Debug, Error)]
pub enum Error {
    #[error(transparent)]
    Db(#[from] DBError),

    #[error(transparent)]
    File(#[from] FileError),

    #[error("Internal server error")]
    InternalServerError,
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

            Error::File(FileError::Forbidden) => {
                json_error(StatusCode::FORBIDDEN, "Access to file is forbidden")
            }
            Error::File(FileError::FileNotFound) => {
                json_error(StatusCode::NOT_FOUND, "File not found")
            }
            Error::File(e) => json_error(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()),

            Error::InternalServerError => {
                json_error(StatusCode::INTERNAL_SERVER_ERROR, "Server error")
            }
        }
    }
}
