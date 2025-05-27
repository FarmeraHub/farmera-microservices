use std::env;

use jsonwebtoken::{DecodingKey, Validation};
use serde::{Deserialize, Serialize};

use crate::errors::jwt_error::JWTError;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    id: String,
    email: String,
    first_name: String,
    last_name: String,
    phone: String,
    role: String,
    status: String,
    avatar: String,
}

pub struct JwtUtils;

impl JwtUtils {
    pub fn verify_access_token(token: &str) -> Result<Claims, JWTError> {
        let secret_key = env::var("JWT_ACCESS_SECRET").map_err(|e| {
            log::error!("JWT_ACCESS_SECRET must be set");
            JWTError::MissingEnvError(e)
        })?;

        // decode & validate access token
        let token_data = jsonwebtoken::decode(
            token,
            &DecodingKey::from_secret(secret_key.as_ref()),
            &Validation::default(),
        )
        .map_err(|e| {
            log::error!("Jwt decode error: {e}");
            JWTError::Error(e)
        })?
        .claims;

        // Return the valid token claims.
        Ok(token_data)
    }
}
