use std::{
    collections::{HashMap, HashSet},
    io,
    pin::pin,
    sync::Arc,
    time::Duration,
};

use chrono::{DateTime, Utc};
use deadpool_redis::Pool;
use futures_util::{
    future::{select, Either},
    StreamExt,
};
use redis::AsyncCommands;
use tokio::{
    sync::{
        mpsc::{self},
        watch, RwLock,
    },
    time::{interval, sleep},
};
use uuid::Uuid;

use crate::{
    errors::chat_error::ChatError,
    grpc::noti_client::NotificationGrpcClient,
    models::{
        attachment::{MediaContent, SentMedia},
        message::{MessageContent, SentMessage},
        notification_mapping_impl::NotificationType,
        notification_models::push::{PushMessage, PushMessageType},
        MessageType,
    },
    repositories::{conversation_repo::ConversationRepo, message_repo::MessageRepo},
};

use super::{
    chat_server_handler::ChatServerHandler, Command, ConnId, ConversationId, SendMsg, UserId,
};

const INTERVAL: Duration = Duration::from_secs(20);

pub struct ChatServer {
    sessions: Arc<RwLock<HashMap<ConnId, mpsc::UnboundedSender<SendMsg>>>>,
    subscribed_channels: Arc<RwLock<HashMap<String, watch::Sender<bool>>>>,
    redis_client: Arc<redis::Client>,
    redis_pool: Arc<Pool>,
    conversation_repo: Arc<ConversationRepo>,
    message_repo: Arc<MessageRepo>,
    notification_service_client: NotificationGrpcClient,
    pub cmd_rx: mpsc::UnboundedReceiver<Command>,
}

impl ChatServer {
    pub async fn new(
        redis_pool: Arc<Pool>,
        redis_client: Arc<redis::Client>,
        conversation_repo: Arc<ConversationRepo>,
        message_repo: Arc<MessageRepo>,
        notification_service_client: NotificationGrpcClient,
    ) -> (Self, ChatServerHandler) {
        let sessions = Arc::new(RwLock::new(HashMap::new()));
        let subscribed_channels = Arc::new(RwLock::new(HashMap::new()));

        let (cmd_tx, cmd_rx) = mpsc::unbounded_channel();

        (
            Self {
                sessions,
                subscribed_channels,
                redis_client,
                redis_pool,
                conversation_repo,
                message_repo,
                cmd_rx,
                notification_service_client,
            },
            ChatServerHandler::new(cmd_tx),
        )
    }

    /// worker handles the received messages in the channel's buffer sent by `ChatServerHandler`
    pub async fn run(mut self) -> io::Result<()> {
        let clone_conversation_repo = self.conversation_repo.clone();
        let clone_redis_pool = self.redis_pool.clone();
        tokio::spawn(async move {
            Self::start_latest_message_cache_interval(clone_conversation_repo, clone_redis_pool)
                .await;
        });

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
                        .join_conversation(user_id, conn_id, conversation_id, false)
                        .await
                    {
                        log::error!(
                            "Failed to join user {user_id} to room {conversation_id} - error: {e}"
                        );
                        let _ = res_tx.send(Err(ChatError::JoinError(format!(
                            "Failed to join user to room"
                        ))));
                    } else {
                        let _ = res_tx.send(Ok(()));
                    }
                }

                Command::Leave {
                    user_id,
                    conn_id,
                    res_tx,
                } => {
                    if let Err(e) = self.leave_converstaion(user_id, conn_id).await {
                        log::error!("Failed to remove user {user_id} - session {conn_id} from current room - error: {e}");
                        let _ = res_tx.send(Err(ChatError::LeaveError(format!(
                            "Failed to remove user to current room"
                        ))));
                    } else {
                        let _ = res_tx.send(Ok(()));
                    }
                }

                Command::Message {
                    user_id,
                    conn_id,
                    msg,
                    r#type,
                    res_tx,
                } => {
                    if let Err(e) = self.send_message(user_id, conn_id, msg, r#type).await {
                        log::error!("Failed to send message from user {user_id} to current room - error: {e}");
                        let _ = res_tx.send(Err(ChatError::MessageError(format!(
                            "Failed to send message from user to room - {e}"
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

        // set user status to online
        redis_conn
            .hset::<&str, &str, &str, ()>(&format!("user:{user_id}"), "status", "online")
            .await?;

        // add user id to online set
        redis_conn
            .sadd::<&str, &str, ()>("online_users", &user_id.to_string())
            .await?;

        // initialize user's session
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
        // remove the user's session from current redis room
        let _ = self
            .leave_converstaion(user_id, conn_id)
            .await
            .map_err(|e| {
                log::error!("{e}");
            });

        let mut redis_conn = self.redis_pool.get().await?;
        // remove the current user's session from redis
        redis_conn
            .hdel::<&str, &str, ()>(&format!("user:{user_id}:sessions"), &conn_id.to_string())
            .await?;

        // remove the current user from online set
        redis_conn
            .srem::<&str, &str, ()>("online_users", &user_id.to_string())
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

        // remove current user's session in local
        let mut sessions = self.sessions.write().await;
        sessions.remove(&conn_id);

        Ok(())
    }

    async fn join_conversation(
        &mut self,
        user_id: UserId,
        conn_id: ConnId,
        conversation_id: ConversationId,
        is_public_room: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut redis_conn = self.redis_pool.get().await?;
        // ensure user in database conversation
        let existed = self
            .conversation_repo
            .check_user_in_conversation(conversation_id, user_id)
            .await?;

        if existed.is_none() {
            if is_public_room {
                // add user to database conversation if they are not in it
                self.conversation_repo
                    .insert_conversation_user(conversation_id, user_id)
                    .await?;
            } else {
                return Err(Box::new(ChatError::JoinError(
                    "User is not allowed to join".to_string(),
                )));
            }
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
            .sadd::<&str, &str, ()>(
                &format!("room:{conversation_id}:active_users"),
                &user_id.to_string(),
            )
            .await?;

        // update room last active time (use for remove subscription)
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

    async fn leave_converstaion(
        &self,
        user_id: UserId,
        conn_id: ConnId,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut redis_conn = self.redis_pool.get().await?;
        // get current conversation_id
        let conversation_id = match self
            .get_current_session_room(&mut redis_conn, &user_id, &conn_id)
            .await
        {
            Some(room_id) => room_id,
            None => {
                return Err(ChatError::LeaveError(
                    "Room not found, user must join a room first".to_string(),
                )
                .into())
            }
        };

        // update session active_room to none
        redis_conn
            .hset::<&str, &str, &str, ()>(
                &format!("user:{user_id}:sessions"),
                &conn_id.to_string(),
                &serde_json::json!({"active_room": ""}).to_string(),
            )
            .await?;

        // loop through all current user's session, if none of them are in the current conversation, remove the user_id from the room
        let user_sessions: HashMap<String, String> = redis_conn
            .hgetall(&format!("user:{user_id}:sessions"))
            .await?;

        let mut is_remain = false;
        for value in user_sessions.values() {
            if let Ok(json_value) = serde_json::from_str::<serde_json::Value>(&value) {
                if let Some(v) = json_value.get("active_room") {
                    if v.as_str().unwrap().to_string() == conversation_id {
                        is_remain = true;
                        break;
                    }
                }
            }
        }

        if !is_remain {
            redis_conn
                .srem::<&str, &str, ()>(
                    &format!("room:{conversation_id}:active_users"),
                    &user_id.to_string(),
                )
                .await?;

            // if there are no users in the room, unsubscribe
            if redis_conn
                .scard::<&str, i32>(&format!("room:{conversation_id}:active_users"))
                .await?
                == 0
            {
                self.unsubscribe(format!("room:{conversation_id}")).await;
            }
        }

        Ok(())
    }

    async fn send_message(
        &mut self,
        user_id: UserId,
        conn_id: ConnId,
        msg: SendMsg,
        msg_type: String,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut redis_conn = self.redis_pool.get().await?;

        // get the current conversation the user's session is participating in
        let active_room = match self
            .get_current_session_room(&mut redis_conn, &user_id, &conn_id)
            .await
        {
            Some(room_id) => room_id,
            None => return Err(ChatError::MessageError(format!("User is not in any room")).into()),
        };

        // generate message json
        let timestamp = Utc::now();
        let msg_json = match Self::generate_message_json(
            user_id.clone(),
            &msg,
            &msg_type,
            timestamp.clone(),
        ) {
            Ok(value) => value,
            Err(e) => {
                return Err(e.into());
            }
        };

        // publish message to subcriber
        match redis_conn
            .publish::<&str, &str, ()>(&format!("room:{active_room}"), &msg_json.to_string())
            .await
        {
            Ok(_) => {
                if msg_type == "message" {
                    // for normal messages
                    if let Some(content) = msg_json["message"].as_str() {
                        self.handle_offline_message(
                            active_room.parse::<i32>()?,
                            user_id,
                            content,
                            timestamp,
                        );
                    }

                    // !TODO: for live stream messages
                }
            }
            Err(e) => {
                return Err(e.into());
            }
        }

        Ok(())
    }

    async fn _send_system_message() {
        todo!();
    }

    async fn subscribe(&self, channel: String) -> Result<(), Box<dyn std::error::Error>> {
        // Check if already subscribed
        let channels = self.subscribed_channels.read().await;
        if channels.contains_key(&channel) {
            log::info!("Already subscribed to channel: {}", channel);
            return Ok(());
        }
        drop(channels);

        // Add channel to subscribed list
        let (unsub_tx, mut unsub_rx) = watch::channel(false);
        let mut channels = self.subscribed_channels.write().await;
        channels.insert(channel.clone(), unsub_tx);
        drop(channels);

        let client = self.redis_client.clone();
        let channel_clone = channel.clone();
        let sessions = self.sessions.clone();
        let redis_pool = self.redis_pool.clone();

        // Spawn a task for the subscription
        tokio::spawn(async move {
            // Create a pub/sub connection
            let mut pubsub = client.get_async_pubsub().await.unwrap();
            if let Err(e) = pubsub.subscribe(&channel_clone).await {
                log::error!("Failed to subscribe to channel {}: {}", channel_clone, e);
                return;
            }

            log::info!("Subscribed to channel: {}", channel_clone);

            let mut msg_stream = pubsub.on_message();

            loop {
                let unsub_rx = pin!(unsub_rx.changed());

                let msg = pin!(msg_stream.next());

                match select(unsub_rx, msg).await {
                    // handle unsubscription
                    Either::Left((Ok(_), _)) => {
                        log::info!("Unsubscribe from channel: {channel_clone}");
                        break;
                    }

                    Either::Left((Err(_), _)) => {
                        log::warn!("Unsub channel closed");
                        log::info!("Unsubscribe from channel: {channel_clone}");
                        break;
                    }

                    // handle incoming messages
                    Either::Right((Some(msg), _)) => {
                        match msg.get_payload::<String>() {
                            Ok(payload) => {
                                // log::info!("Received message on channel {}: {}", channel_clone, payload);
                                if let Err(e) = Self::handle_incoming_messages(
                                    sessions.clone(),
                                    redis_pool.clone(),
                                    &channel_clone,
                                    &payload,
                                )
                                .await
                                {
                                    log::error!("Failed to handle incomming message: {e}");
                                }
                            }
                            Err(e) => {
                                log::error!(
                                    "Failed to decode message on channel {channel_clone}: {e}"
                                );
                            }
                        }
                    }
                    Either::Right((None, _)) => {
                        log::info!("PubSub stream closed");
                        break;
                    }
                }
            }
        });

        Ok(())
    }

    async fn unsubscribe(&self, channel: String) {
        // Check if already subscribed
        let channels = self.subscribed_channels.read().await;
        if !channels.contains_key(&channel) {
            log::info!("Already unsubscribed from channel: {}", channel);
        }

        // get unsubscription sender
        let unsub_tx = match channels.get(&channel) {
            Some(tx) => tx,
            None => {
                log::error!("Unsubscription sender not found");
                return;
            }
        };

        // send unsubscibe signal
        match unsub_tx.send(true) {
            Ok(_) => {
                // remove subscription in local
                drop(channels);
                let mut channels = self.subscribed_channels.write().await;
                channels.remove(&channel);
                log::info!("Channel {channel} removed");
            }
            Err(e) => {
                log::error!("Send error: {e}");
            }
        }
    }

    async fn handle_incoming_messages(
        sessions: Arc<RwLock<HashMap<ConnId, mpsc::UnboundedSender<SendMsg>>>>,
        redis_pool: Arc<Pool>,
        channel: &str,
        message: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if channel.starts_with("room:") {
            let mut redis_conn = redis_pool.get().await?;
            let conversation_id: &str = channel.split(":").collect::<Vec<&str>>()[1];

            // delivery to sessions active in conversation
            // get users in current conversation
            let active_users: Vec<String> = redis_conn
                .smembers(&format!("room:{conversation_id}:active_users"))
                .await?;

            let sessions = sessions.read().await;

            // find session (local conn_id) of users in current conversation and send message to that session
            for user_id in &active_users {
                // get all sessions of the user
                let user_sessions: HashMap<String, String> = redis_conn
                    .hgetall(&format!("user:{}:sessions", user_id))
                    .await?;

                // get the session in the current conversation
                let active_sessions: Vec<_> = user_sessions
                    .into_iter()
                    .filter_map(|(session_id, status)| {
                        let value: serde_json::Value = serde_json::from_str(&status).ok()?;
                        let active_room = value.get("active_room")?.as_str()?;
                        if active_room == conversation_id {
                            Some(session_id)
                        } else {
                            None
                        }
                    })
                    .collect();

                for conn_id in &active_sessions {
                    if let Ok(conn_id) = Uuid::parse_str(&conn_id) {
                        if let Some(sender) = sessions.get(&conn_id) {
                            sender.send(message.to_string()).unwrap();
                        }
                    }
                }
            }
        } else {
            log::error!("Invalid channel");
        }
        Ok(())
    }

    async fn get_current_session_room(
        &self,
        redis_conn: &mut deadpool_redis::Connection,
        user_id: &UserId,
        conn_id: &ConnId,
    ) -> Option<String> {
        let session_state: String = match redis_conn
            .hget(&format!("user:{user_id}:sessions"), &conn_id.to_string())
            .await
        {
            Ok(result) => result,
            Err(e) => {
                log::error!("Get room error: {e}");
                return None;
            }
        };

        let value: serde_json::Value = match serde_json::from_str(&session_state) {
            Ok(value) => value,
            Err(e) => {
                log::error!("Get room error: {e}");
                return None;
            }
        };

        let active_room = match value["active_room"].as_str() {
            Some(value) => value,
            None => {
                log::error!("Room not found");
                return None;
            }
        };

        if active_room.is_empty() {
            return None;
        }

        Some(active_room.to_string())
    }

    async fn get_not_active_users(
        redis_pool: Arc<Pool>,
        conversation_repo: Arc<ConversationRepo>,
        conversation_id: ConversationId,
    ) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        let mut redis_conn = redis_pool.get().await?;
        // get all user ids from conversation
        let participants = conversation_repo
            .find_users_by_conversation_id(conversation_id)
            .await?;
        let user_ids: Vec<String> = participants.iter().map(|p| p.user_id.to_string()).collect();

        // log::debug!("user_ids: {user_ids:?}");

        // get all user ids active
        let active_user_ids: HashSet<String> = redis_conn
            .smembers(format!("room:{conversation_id}:active_users"))
            .await?;

        // log::debug!("active_user_ids: {active_user_ids:?}");

        let offline_user_ids: Vec<String> = user_ids
            .into_iter()
            .filter(|uid| !active_user_ids.contains(uid))
            .collect();

        Ok(offline_user_ids)
    }

    fn handle_offline_message(
        &self,
        conversation_id: i32,
        sender_id: Uuid,
        content: &str,
        sent_at: DateTime<Utc>,
    ) {
        let redis_pool = self.redis_pool.clone();
        let message_repo = self.message_repo.clone();
        let conversation_repo = self.conversation_repo.clone();
        let content_clone = content.to_owned();
        let mut notification_client = self.notification_service_client.clone();

        tokio::spawn(async move {
            // get inactive users
            let inactive_users =
                Self::get_not_active_users(redis_pool.clone(), conversation_repo, conversation_id)
                    .await
                    .unwrap_or_default();

            log::info!("inactive: {:?}", inactive_users);

            let is_read = if inactive_users.is_empty() {
                true
            } else {
                false
            };

            // send push notificaiton to inactive users
            let title = format!("New message from {}", sender_id);
            for user_id in inactive_users {
                // get user device tokens
                // !TODO: cache
                match notification_client
                    .get_user_device_token(user_id.clone())
                    .await
                {
                    Ok(result) => {
                        let recipents = result.into_inner().device_token;
                        let _ = notification_client
                            .send_push_notification(PushMessage {
                                recipient: recipents,
                                r#type: PushMessageType::Token,
                                template_id: None,
                                template_props: None,
                                title: title.clone(),
                                content: Some(content_clone.clone()),
                                notification_type: NotificationType::Chat,
                            })
                            .await;
                    }
                    Err(e) => {
                        log::error!(
                            "Cannot get device tokens of user {} - error: {}",
                            user_id.clone(),
                            e
                        );
                    }
                };
            }

            // save message and status to database
            let message_id = message_repo
                .insert_message(
                    conversation_id,
                    sender_id,
                    Some(content_clone),
                    MessageType::Message,
                    sent_at,
                    is_read,
                )
                .await;

            if message_id.is_ok() {
                // cache latest message
                let redis_conn = redis_pool.get().await;
                match redis_conn {
                    Ok(mut conn) => {
                        let _ = conn
                            .hset::<&str, &str, i64, ()>(
                                "pending_updates",
                                &conversation_id.to_string(),
                                message_id.unwrap(),
                            )
                            .await
                            .map_err(|e| {
                                log::error!("Cache latest message error: {e}");
                            });
                    }
                    Err(e) => {
                        log::error!("Get redis connection error: {e}");
                    }
                }
            }
        });
    }

    fn generate_message_json(
        user_id: UserId,
        msg: &str,
        msg_type: &str,
        timestamp: DateTime<Utc>,
    ) -> Result<serde_json::Value, ChatError> {
        match msg_type {
            "message" => {
                if let Ok(value) = serde_json::from_str::<MessageContent>(msg) {
                    if value.message.is_empty() {
                        return Err(ChatError::MessageError("Empty message body".to_string()));
                    }
                    return Ok(serde_json::json!(SentMessage {
                        sender_id: user_id,
                        r#type: "message".to_string(),
                        message: value.message,
                        timestamp: timestamp.clone(),
                    }));
                }
                Err(ChatError::MessageError(
                    "Invalid message content".to_string(),
                ))
            }
            "media" => {
                log::info!("{}", msg);
                if let Ok(values) = serde_json::from_str::<Vec<MediaContent>>(msg) {
                    for value in &values {
                        if value.url.is_empty() || value.size <= 0 || value.r#type.is_empty() {
                            return Err(ChatError::MessageError("Empty media body".to_string()));
                        }
                    }
                    return Ok(serde_json::json!(SentMedia {
                        sender_id: user_id,
                        r#type: "media".to_string(),
                        timestamp: timestamp.clone(),
                        media: values
                    }));
                }
                Err(ChatError::MessageError("Invalid media content".to_string()))
            }
            _ => Err(ChatError::MessageError(
                "Invalid message type content".to_string(),
            )),
        }
    }

    async fn start_latest_message_cache_interval(
        conversation_repo: Arc<ConversationRepo>,
        redis_pool: Arc<Pool>,
    ) {
        let mut interval = interval(INTERVAL);

        loop {
            interval.tick().await;

            let redis_conn_result = redis_pool.get().await;

            match redis_conn_result {
                Ok(mut redis_conn) => {
                    if let Err(err) =
                        Self::process_updates(&conversation_repo, &mut redis_conn).await
                    {
                        log::error!("Error processing latest message updates: {:?}", err);
                    }
                }
                Err(e) => {
                    log::error!(
                        "Redis connection error while caching latest message: {:?}",
                        e
                    );
                }
            }
        }
    }

    async fn process_updates(
        conversation_repo: &Arc<ConversationRepo>,
        redis_conn: &mut deadpool_redis::Connection,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let map: HashMap<String, i64> = redis_conn.hgetall("pending_updates").await?;

        if map.is_empty() {
            sleep(Duration::from_secs(60)).await;
            return Ok(());
        }

        redis_conn.del::<_, ()>("pending_updates").await?;

        for (conv_id_str, message_id) in map {
            match conv_id_str.parse::<i32>() {
                Ok(conversation_id) => {
                    conversation_repo
                        .update_latest_message(conversation_id, message_id)
                        .await?
                }
                Err(e) => {
                    log::error!("Failed to parse conversation id '{conv_id_str}': {e}");
                }
            }
        }

        Ok(())
    }
}
