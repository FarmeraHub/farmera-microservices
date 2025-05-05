pub mod db_error;
pub mod sending_error;

use actix_web::{HttpResponse, ResponseError};

use db_error::DBError;
use thiserror::Error;

use crate::models::reponse::Response;

#[derive(Debug, Error)]
pub enum Error {
    #[error(transparent)]
    Db(#[from] DBError),
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
        }
    }
}
