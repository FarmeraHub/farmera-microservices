use std::env::VarError;

#[derive(Debug, thiserror::Error)]
pub enum JWTError {
    #[error("Missing JWT_ACCESS_SECRET")]
    MissingEnvError(VarError),

    #[error("JWT error")]
    Error(jsonwebtoken::errors::Error),
}
