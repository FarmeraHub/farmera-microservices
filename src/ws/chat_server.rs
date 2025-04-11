use std::{
    collections::{HashMap, HashSet},
    io,
    sync::Arc,
};

use deadpool_redis::Pool;
use futures_util::StreamExt;
use redis::AsyncCommands;
use tokio::sync::{mpsc, RwLock};
use uuid::Uuid;

use crate::{errors::chat_error::ChatError, repositories::conversation_repo::ConversationRepo};

use super::{
    chat_server_handler::ChatServerHandler, Command, ConnId, ConversationId, SendMsg, UserId,
};

pub struct ChatServer {
    sessions: Arc<RwLock<HashMap<ConnId, mpsc::UnboundedSender<SendMsg>>>>,
    subscribed_channels: Arc<RwLock<HashSet<String>>>,
    redis_client: Arc<redis::Client>,
    redis_pool: Arc<Pool>,
    conversation_repo: Arc<ConversationRepo>,
    cmd_rx: mpsc::UnboundedReceiver<Command>,
}

impl ChatServer {
    pub async fn new(
        redis_pool: Arc<Pool>,
        redis_client: Arc<redis::Client>,
        conversation_repo: Arc<ConversationRepo>,
    ) -> (Self, ChatServerHandler) {
        let sessions = Arc::new(RwLock::new(HashMap::new()));
        let subscribed_channels = Arc::new(RwLock::new(HashSet::new()));

        let (cmd_tx, cmd_rx) = mpsc::unbounded_channel();

        (
            Self {
                sessions,
                subscribed_channels,
                redis_client,
                redis_pool,
                conversation_repo,
                cmd_rx,
            },
            ChatServerHandler::new(cmd_tx),
        )
    }

    /// worker handles the received messages in the channel's buffer sent by `ChatServerHandler`
    pub async fn run(mut self) -> io::Result<()> {
        while let Some(cmd) = self.cmd_rx.recv().await {
            match cmd {
                Command::Connect {
                    user_id,
                    conn_tx,
                    res_tx,
                } => {
                    // generate new id for each connection
                    let conn_id = Uuid::new_v4();
                    // attempt to connect
                    let result = self.connect(conn_id, user_id, conn_tx).await;
                    if let Err(e) = result {
                        log::error!("Failed to connect user - id: {user_id} - error: {e}");
                        let _ = res_tx.send(None);
                    } else {
                        let _ = res_tx.send(Some(conn_id));
                    }
                }

                Command::Disconnect { user_id, conn_id } => {
                    let _ = self.disconnect(user_id, conn_id).await;
                }

                Command::Join {
                    user_id,
                    conn_id,
                    conversation_id,
                    res_tx,
                } => {
                    if let Err(e) = self
                        .join_conversation(user_id, conn_id, conversation_id)
                        .await
                    {
                        log::error!("Failed to join user {user_id} to room {conversation_id}: {e}");
                        let _ = res_tx.send(Err(ChatError::JoinError(format!(
                            "Failed to join user {user_id} to room {conversation_id}"
                        ))));
                    } else {
                        let _ = res_tx.send(Ok(()));
                    }
                }

                Command::Message {
                    user_id,
                    conn_id,
                    conversation_id,
                    msg,
                    res_tx,
                } => {
                    if let Err(e) = self
                        .send_message(user_id, conn_id, conversation_id, msg)
                        .await
                    {
                        log::error!("Failed to send message from user {user_id} to room {conversation_id} - error: {e}");
                        let _ = res_tx.send(Err(ChatError::MessageError(format!(
                            "Failed to send message from user {user_id} to room {conversation_id}"
                        ))));
                    } else {
                        let _ = res_tx.send(Ok(()));
                    }
                }
            }
        }

        Ok(())
    }

    async fn connect(
        &mut self,
        conn_id: ConnId,
        user_id: UserId,
        conn_tx: mpsc::UnboundedSender<SendMsg>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut redis_conn = self.redis_pool.get().await?;
        // register local session
        let mut sessions = self.sessions.write().await;
        sessions.insert(conn_id, conn_tx);

        redis_conn
            .hset::<&str, &str, &str, ()>(&format!("user:{user_id}"), "status", "online")
            .await?;

        redis_conn
            .hset::<&str, &str, &str, ()>(
                &format!("user:{user_id}:sessions"),
                &conn_id.to_string(),
                &serde_json::json!({"active_room": ""}).to_string(),
            )
            .await?;

        log::info!("connection id: {conn_id} - connected");

        Ok(())
    }

    async fn disconnect(
        &mut self,
        user_id: UserId,
        conn_id: ConnId,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut redis_conn = self.redis_pool.get().await?;
        // remove current session from redis
        redis_conn
            .hdel::<&str, &str, ()>(&format!("user:{user_id}:sessions"), &conn_id.to_string())
            .await?;

        // set user's status to offline if all sessions are removed
        let session_count = redis_conn
            .hlen::<&str, i64>(&format!("user:{user_id}:sessions"))
            .await?;

        if session_count == 0 {
            redis_conn
                .hset::<&str, &str, &str, ()>(&format!("user:{user_id}"), "status", "offline")
                .await?
        }

        // remove current session in local
        let mut sessions = self.sessions.write().await;
        sessions.remove(&conn_id);

        Ok(())
    }

    async fn join_conversation(
        &mut self,
        user_id: UserId,
        conn_id: ConnId,
        conversation_id: ConversationId,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut redis_conn = self.redis_pool.get().await?;
        // ensure user in conversation
        let existed = self
            .conversation_repo
            .check_user_in_conversation(conversation_id, user_id)
            .await?;

        // add user to conversation if they are not in it
        if existed.is_none() {
            self.conversation_repo
                .insert_conversation_user(conversation_id, user_id)
                .await?;
        }

        // join user to redis's room
        redis_conn
            .hset::<&str, &str, &str, ()>(
                &format!("user:{user_id}:sessions"),
                &conn_id.to_string(),
                &serde_json::json!({"active_room": conversation_id.to_string()}).to_string(),
            )
            .await?;

        redis_conn
            .hset::<&str, &str, &str, ()>(
                &format!("room:{conversation_id}"),
                "last_active",
                &chrono::Utc::now().timestamp().to_string(),
            )
            .await?;

        self.subscribe(format!("room:{conversation_id}"))
            .await
            .unwrap();

        Ok(())
    }

    async fn send_message(
        &mut self,
        user_id: UserId,
        conn_id: ConnId,
        conversation_id: ConversationId,
        msg: SendMsg,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut redis_conn = self.redis_pool.get().await?;

        // get the current conversation the user is participating in
        let session_state: String = redis_conn
            .hget(&format!("user:{user_id}:sessions"), &conn_id.to_string())
            .await?;

        let value: serde_json::Value = serde_json::from_str(&session_state)?;

        log::info!("{value}");

        let active_room = match value["active_room"].as_str() {
            Some(value) => value,
            None => {
                return Err(ChatError::MessageError(
                    "User must join room to send message".to_string(),
                )
                .into())
            }
        };

        if active_room.to_string() != conversation_id.to_string() {
            return Err(
                ChatError::MessageError(format!("User not in room '{conversation_id}'")).into(),
            );
        }

        // save message to database
        self.conversation_repo
            .insert_conversation_user(conversation_id, user_id)
            .await?;

        // publish message to subcriber
        redis_conn
            .publish::<&str, &str, ()>(
                &format!("room:{conversation_id}"),
                &serde_json::json!(msg).to_string(),
            )
            .await?;

        Ok(())
    }

    async fn subscribe(&self, channel: String) -> Result<(), Box<dyn std::error::Error>> {
        // Check if already subscribed
        let channels = self.subscribed_channels.read().await;
        if channels.contains(&channel) {
            log::info!("Already subscribed to channel: {}", channel);
            return Ok(());
        }
        drop(channels);

        // Add channel to subscribed list
        let mut channels = self.subscribed_channels.write().await;
        channels.insert(channel.clone());
        drop(channels);

        let client = self.redis_client.clone();
        let channel_clone = channel.clone();

        // Spawn a task for the subscription
        tokio::spawn(async move {
            // Create a pub/sub connection
            let mut pubsub = client.get_async_pubsub().await.unwrap();
            if let Err(e) = pubsub.subscribe(&channel_clone).await {
                log::error!("Failed to subscribe to channel {}: {}", channel_clone, e);
                return;
            }

            log::info!("Subscribed to channel: {}", channel_clone);

            // Handle incoming messages
            while let Some(msg) = pubsub.on_message().next().await {
                match msg.get_payload::<String>() {
                    Ok(payload) => {
                        log::info!("Received message on channel {}: {}", channel_clone, payload);
                    }
                    Err(e) => {
                        log::error!(
                            "Failed to decode message on channel {}: {}",
                            channel_clone,
                            e
                        );
                    }
                }
            }

            log::info!("Subscription to channel {} ended", channel_clone);
        });

        Ok(())
    }
}
