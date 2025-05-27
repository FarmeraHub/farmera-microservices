pub mod dispatcher_actor;
pub mod dispatcher_wrapper;
pub mod email_dispatcher;
pub mod push_dispatcher;

use async_trait::async_trait;

use crate::errors::sending_error::SendingError;

#[async_trait]
pub trait Dispatcher: Send + Sync {
    async fn send(&self, msg: &str) -> Result<(), SendingError>;
}
