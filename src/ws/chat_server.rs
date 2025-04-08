use std::{collections::HashMap, io, sync::Arc};

use tokio::sync::{mpsc, RwLock};

use crate::models::message::Message;

use super::{chat_server_handler::ChatServerHandler, Command, ConnId};

pub struct ChatServer {
    sessions: Arc<RwLock<HashMap<ConnId, mpsc::UnboundedSender<Message>>>>,
    cmd_rx: mpsc::UnboundedReceiver<Command>,
}

impl ChatServer {
    pub fn new() -> (Self, ChatServerHandler) {
        let sessions = Arc::new(RwLock::new(HashMap::new()));

        // !Todo: fetch data from database
        //

        let (cmd_tx, cmd_rx) = mpsc::unbounded_channel();

        (Self { sessions, cmd_rx }, ChatServerHandler::new(cmd_tx))
    }

    /// worker handles the received messages in the channel's buffer sent by `ChatServerHandler`
    pub async fn run(mut self) -> io::Result<()> {
        while let Some(cmd) = self.cmd_rx.recv().await {
            match cmd {
                Command::Connect {
                    conn_id,
                    conn_tx,
                    res_tx,
                } => {
                    self.connect(conn_id, conn_tx).await;
                    let _ = res_tx.send(());
                }

                Command::Disconnect { conn_id } => {
                    self.disconnect(conn_id).await;
                }
            }
        }

        Ok(())
    }

    async fn connect(&self, conn_id: ConnId, conn_tx: mpsc::UnboundedSender<Message>) {
        // register session with user ID
        let mut sessions = self.sessions.write().await;
        sessions.insert(conn_id, conn_tx);

        // !TODO: register current user's conversations

        log::info!("{conn_id} connected");
    }

    async fn disconnect(&mut self, conn_id: ConnId) {
        let mut sessions = self.sessions.write().await;
        sessions.remove(&conn_id);
    }
}
