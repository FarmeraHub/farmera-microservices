use tokio::sync::{mpsc, oneshot};
use uuid::Uuid;

use crate::models::message::Message;

pub mod chat_server;
pub mod chat_server_handler;

pub type ConnId = Uuid;

pub enum Command {
    Connect {
        conn_id: ConnId,
        conn_tx: mpsc::UnboundedSender<Message>,
        res_tx: oneshot::Sender<()>,
    },

    Disconnect {
        conn_id: ConnId,
    },
}
