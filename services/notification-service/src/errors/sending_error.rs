use std::env::VarError;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum SendingError {
    #[error("Missing GOOGLE_APPLICATION_CREDENTIALS")]
    MissingEnvError(VarError),

    #[error("GCP Auth Error")]
    GCPAuthError(gcp_auth::Error),

    #[error("Invalid data type")]
    JsonParseError,

    #[error("None value: {}", _0)]
    NoneValue(String),

    #[error("Request failed")]
    RequestFailed,

    #[error("Request error")]
    RequestError(reqwest::Error),

    #[error("Database error: {}", _0)]
    DatabaseError(String),

    #[error("Retry to send message error: {}", _0)]
    RetryError(String),
}
