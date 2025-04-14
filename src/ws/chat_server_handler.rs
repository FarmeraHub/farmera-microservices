use tokio::sync::{mpsc, oneshot};

use crate::errors::chat_error::ChatError;

use super::{Command, ConnId, ConversationId, SendMsg, UserId};

#[derive(Debug, Clone)]
pub struct ChatServerHandler {
    cmd_tx: mpsc::UnboundedSender<Command>,
}

impl ChatServerHandler {
    pub fn new(cmd_tx: mpsc::UnboundedSender<Command>) -> Self {
        Self { cmd_tx }
    }

    pub async fn connect(
        &self,
        user_id: UserId,
        conn_tx: mpsc::UnboundedSender<SendMsg>,
    ) -> Option<ConnId> {
        // one shot channel to receive the result
        let (res_tx, res_rx) = oneshot::channel();

        // send connect command to 'ChatServer'
        self.cmd_tx
            .send(Command::Connect {
                user_id,
                conn_tx,
                res_tx,
            })
            .unwrap();

        res_rx.await.unwrap()
    }

    pub fn disconnect(&self, user_id: UserId, conn_id: ConnId) {
        self.cmd_tx
            .send(Command::Disconnect { user_id, conn_id })
            .unwrap();

        log::info!("connection id: {conn_id} - disconnected");
    }

    pub async fn join_conversation(
        &self,
        user_id: UserId,
        conn_id: ConnId,
        conversation_id: ConversationId,
    ) -> Result<(), ChatError> {
        let (res_tx, res_rx) = oneshot::channel();

        self.cmd_tx
            .send(Command::Join {
                user_id,
                conn_id,
                conversation_id,
                res_tx,
            })
            .unwrap();

        res_rx.await.unwrap()
    }

    pub async fn leave_converstaion(
        &self,
        user_id: UserId,
        conn_id: ConnId,
    ) -> Result<(), ChatError> {
        let (res_tx, res_rx) = oneshot::channel();

        self.cmd_tx
            .send(Command::Leave {
                user_id,
                conn_id,
                res_tx,
            })
            .unwrap();

        res_rx.await.unwrap()
    }

    pub async fn send_message(
        &self,
        user_id: UserId,
        conn_id: ConnId,
        msg: SendMsg,
    ) -> Result<(), ChatError> {
        let (res_tx, res_rx) = oneshot::channel();

        self.cmd_tx
            .send(Command::Message {
                user_id,
                conn_id,
                msg,
                res_tx,
            })
            .unwrap();

        res_rx.await.unwrap()
    }
}
