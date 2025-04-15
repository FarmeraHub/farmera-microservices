use actix_web::{HttpResponse, ResponseError};

use db_error::DBError;
use thiserror::Error;

pub mod chat_error;
pub mod db_error;
pub mod redis_error;

#[derive(Debug, Error)]
pub enum Error {
    #[error(transparent)]
    Db(#[from] DBError),
}

impl ResponseError for Error {
    fn error_response(&self) -> actix_web::HttpResponse<actix_web::body::BoxBody> {
        match self {
            Error::Db(e) => match e {
                DBError::QueryError(_) => HttpResponse::InternalServerError()
                    .body(format!("Database query error"))
                    .map_into_boxed_body(),
                DBError::QueryFailed(e) => HttpResponse::InternalServerError()
                    .body(e.to_string())
                    .map_into_boxed_body(),
            },
            // _ => HttpResponse::InternalServerError().finish(),
        }
    }
}
