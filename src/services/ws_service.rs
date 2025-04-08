use std::{pin::pin, time::Duration};

use actix_ws::AggregatedMessage;
use futures_util::{
    future::{select, Either},
    StreamExt,
};
use tokio::{
    sync::mpsc,
    time::{interval, Instant},
};
use uuid::Uuid;

use crate::ws::{chat_server_handler::ChatServerHandler, ConnId};

const HEARTBEAT: Duration = Duration::from_secs(5);

const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

pub struct WSService;

impl WSService {
    pub async fn handle_ws(
        chat_server_handler: ChatServerHandler,
        mut session: actix_ws::Session,
        msg_stream: actix_ws::MessageStream,
        user_id: Uuid,
    ) {
        log::debug!("Connected");

        let mut last_heartbeat = Instant::now();
        let mut interval = interval(HEARTBEAT);

        // sender & receiver channel for connection
        let (conn_tx, mut conn_rx) = mpsc::unbounded_channel();

        chat_server_handler.connect(user_id, conn_tx).await;

        // set limits and customize how data is proccessed
        let msg_stream = msg_stream
            .max_frame_size(128 * 1024) // the maximum permitted size for received WebSocket frames is 128kB
            .aggregate_continuations()
            .max_continuation_size(2 * 1024 * 1024); // the maximum allowed size for aggregated continuations is 2MB

        // 'select' requires Future + Unpin bounds
        let mut msg_stream = pin!(msg_stream);

        let close_reason = loop {
            let tick = pin!(interval.tick());
            let msg_rx = pin!(conn_rx.recv());

            let messages = pin!(select(msg_stream.next(), msg_rx));

            match select(messages, tick).await {
                // commands & messages received from client
                Either::Left((Either::Left((Some(Ok(msg)), _)), _)) => match msg {
                    AggregatedMessage::Text(text) => {
                        log::info!("Text msg received: {text}");
                        Self::process_text_message(
                            &chat_server_handler,
                            &mut session,
                            &text,
                            user_id,
                        )
                        .await;
                    }

                    AggregatedMessage::Binary(_bin) => {
                        log::warn!("Unexpected binanry message");
                    }

                    AggregatedMessage::Ping(bytes) => {
                        log::info!("Ping received: {bytes:?}");
                        last_heartbeat = Instant::now();
                        session.pong(&bytes).await.unwrap();
                    }

                    AggregatedMessage::Pong(_) => {
                        log::info!("Pong received");
                        last_heartbeat = Instant::now();
                    }

                    AggregatedMessage::Close(reason) => {
                        break reason;
                    }
                },

                // client WebSocket stream error
                Either::Left((Either::Left((Some(Err(err)), _)), _)) => {
                    log::error!("Client WebSocket stream error: {}", err);
                    break None;
                }

                // client WebSocket stream ended
                Either::Left((Either::Left((None, _)), _)) => break None,

                // chat messages received from other room participants
                Either::Left((Either::Right((Some(msg), _)), _)) => {
                    log::info!("Msg recevied from other particitpants")
                    // session.text(msg).await.unwrap();
                }

                // all connection's message senders were dropped
                Either::Left((Either::Right((None, _)), _)) => unreachable!(
                    "all connection message senders were dropped; chat server may have panicked"
                ),

                // heartbeat interval tick
                Either::Right((_, _)) => {
                    log::info!("Heartbeat interval tick");
                    // if no heartbeat, close connection
                    if Instant::now().duration_since(last_heartbeat) > CLIENT_TIMEOUT {
                        log::info!("Client {user_id} has not sent heartbeat over {CLIENT_TIMEOUT:?}, disconnecting");
                        break None;
                    }
                    let _ = session.ping(b"").await;
                }
            }
        };

        chat_server_handler.disconnect(user_id);

        let _ = session.close(close_reason).await;
    }

    async fn process_text_message(
        chat_server_handler: &ChatServerHandler,
        session: &mut actix_ws::Session,
        text: &str,
        conn_id: ConnId,
    ) {
    }
}
