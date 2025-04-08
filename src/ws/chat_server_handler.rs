use tokio::sync::{mpsc, oneshot};

use crate::models::message::Message;

use super::{Command, ConnId};

#[derive(Debug, Clone)]
pub struct ChatServerHandler {
    cmd_tx: mpsc::UnboundedSender<Command>,
}

impl ChatServerHandler {
    pub fn new(cmd_tx: mpsc::UnboundedSender<Command>) -> Self {
        Self { cmd_tx }
    }

    pub async fn connect(&self, conn_id: ConnId, conn_tx: mpsc::UnboundedSender<Message>) {
        // one shot channel to receive the result
        let (res_tx, res_rx) = oneshot::channel();

        self.cmd_tx
            .send(Command::Connect {
                conn_id,
                conn_tx,
                res_tx,
            })
            .unwrap();

        res_rx.await.unwrap()
    }

    pub fn disconnect(&self, conn_id: ConnId) {
        self.cmd_tx.send(Command::Disconnect { conn_id }).unwrap();

        log::info!("{conn_id} disconnected");
    }
}
