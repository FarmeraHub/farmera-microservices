use tokio::sync::{mpsc, oneshot};
use uuid::Uuid;

use crate::errors::chat_error::ChatError;

pub mod chat_server;
pub mod chat_server_handler;

pub type ConnId = Uuid;
pub type UserId = Uuid;
pub type ConversationId = i32;
pub type SendMsg = String;

pub enum Command {
    Connect {
        user_id: UserId,
        conn_tx: mpsc::UnboundedSender<String>,
        res_tx: oneshot::Sender<Option<ConnId>>,
    },

    Disconnect {
        user_id: UserId,
        conn_id: ConnId,
    },

    Join {
        user_id: UserId,
        conn_id: ConnId,
        conversation_id: ConversationId,
        res_tx: oneshot::Sender<Result<(), ChatError>>,
    },

    Message {
        user_id: UserId,
        conn_id: ConnId,
        conversation_id: ConversationId,
        msg: SendMsg,
        res_tx: oneshot::Sender<Result<(), ChatError>>,
    },
}
