use actix_web::{HttpResponse, ResponseError};
use api_error::APIError;
use db_error::DBError;
use thiserror::Error;

pub mod api_error;
pub mod chat_error;
pub mod db_error;
pub mod redis_error;

#[derive(Debug, Error)]
pub enum Error {
    #[error(transparent)]
    Db(#[from] DBError),

    #[error(transparent)]
    Api(#[from] APIError),
}

impl ResponseError for Error {
    fn error_response(&self) -> actix_web::HttpResponse<actix_web::body::BoxBody> {
        match *self {
            Error::Db(_) => HttpResponse::InternalServerError().finish(),
            _ => HttpResponse::InternalServerError().finish(),
        }
    }
}
