use actix_web::{HttpResponse, ResponseError};

use db_error::DBError;
use file_error::FileError;
use thiserror::Error;

use crate::models::response::Response;

pub mod chat_error;
pub mod db_error;
pub mod file_error;
pub mod redis_error;

#[derive(Debug, Error)]
pub enum Error {
    #[error(transparent)]
    Db(#[from] DBError),

    #[error(transparent)]
    File(#[from] FileError),
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

            Error::File(e) => match e {
                _ => HttpResponse::InternalServerError().json(Response {
                    r#type: "error".to_string(),
                    message: e.to_string(),
                }),
            }, // _ => HttpResponse::InternalServerError().finish(),
        }
    }
}
