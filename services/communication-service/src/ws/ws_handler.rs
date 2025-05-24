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

use crate::{
    models::ws::{Event, WSRequest, WSResponse},
    ws::{chat_server_handler::ChatServerHandler, ConnId, UserId},
};

const HEARTBEAT: Duration = Duration::from_secs(5);

const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

pub struct WSHandler;

impl WSHandler {
    pub async fn handle_ws(
        chat_server_handler: ChatServerHandler,
        mut session: actix_ws::Session,
        msg_stream: actix_ws::MessageStream,
        user_id: UserId,
    ) {
        log::debug!("Connected");

        let mut last_heartbeat = Instant::now();
        let mut interval = interval(HEARTBEAT);

        // sender & receiver channel for connection
        let (conn_tx, mut conn_rx) = mpsc::unbounded_channel();

        // attempt to connect
        let conn_id = match chat_server_handler.connect(user_id, conn_tx).await {
            Some(id) => {
                // send a successful connection response
                let _ = session
                    .text(
                        serde_json::json!(WSResponse {
                            id: "".to_string(),
                            event: Event::Connect,
                            data: serde_json::json!({"connection_id": id}),
                            status: "connected".to_string(),
                        })
                        .to_string(),
                    )
                    .await;
                id
            }
            None => return,
        };

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
                        // log::info!("Text msg received: {text}");
                        Self::process_text_message(
                            &chat_server_handler,
                            &mut session,
                            &text,
                            user_id,
                            conn_id,
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
                        // log::info!("Pong received");
                        last_heartbeat = Instant::now();
                    }

                    AggregatedMessage::Close(reason) => {
                        log::info!("Close msg received");
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
                    log::info!("Msg recevied from other particitpants");
                    Self::process_receive_message(&mut session, &msg).await;
                }

                // all connection's message senders were dropped
                Either::Left((Either::Right((None, _)), _)) => unreachable!(
                    "all connection message senders were dropped; chat server may have panicked"
                ),

                // heartbeat interval tick
                Either::Right((_, _)) => {
                    // log::info!("Heartbeat interval tick");
                    // if no heartbeat, close connection
                    if Instant::now().duration_since(last_heartbeat) > CLIENT_TIMEOUT {
                        log::info!("Client {user_id} has not sent heartbeat over {CLIENT_TIMEOUT:?}, disconnecting");
                        break None;
                    }
                    let _ = session.ping(b"").await;
                }
            }
        };

        chat_server_handler.disconnect(user_id, conn_id);

        let _ = session.close(close_reason).await;
    }

    async fn process_text_message(
        chat_server_handler: &ChatServerHandler,
        session: &mut actix_ws::Session,
        text: &str,
        user_id: UserId,
        conn_id: ConnId,
    ) {
        let mut response = WSResponse {
            id: "-1".to_string(),
            event: Event::Error,
            status: "error".to_string(),
            data: serde_json::json!(""),
        };

        // log::info!("{}", text);

        match serde_json::from_str::<WSRequest>(text) {
            Ok(request) => {
                response.id = request.id;

                match request.event {
                    Event::Join => {
                        response.event = Event::Join;

                        if let Ok(data_value) =
                            serde_json::from_value::<serde_json::Value>(request.data)
                        {
                            if let Some(conversation_id) = data_value["conversation_id"].as_i64() {
                                match chat_server_handler
                                    .join_conversation(user_id, conn_id, conversation_id as i32)
                                    .await
                                {
                                    Ok(_) => {
                                        response.status = "joined".to_string();
                                    }
                                    Err(e) => {
                                        response.data =
                                            serde_json::json!({"message": e.to_string()})
                                    }
                                }
                            }
                        }
                    }

                    Event::Message => {
                        response.event = Event::Message;

                        if let Ok(data_value) =
                            serde_json::from_value::<serde_json::Value>(request.data)
                        {
                            if let (Some(r#type), Some(content)) =
                                (data_value["type"].as_str(), data_value.get("content"))
                            {
                                let content = match serde_json::to_string(content) {
                                    Ok(result) => result,
                                    Err(e) => {
                                        log::error!("{e}");
                                        "".to_string()
                                    }
                                };
                                if !content.is_empty() {
                                    match chat_server_handler
                                        .send_message(
                                            user_id,
                                            conn_id,
                                            content.to_owned(),
                                            r#type.to_owned(),
                                        )
                                        .await
                                    {
                                        Ok(_) => {
                                            response.status = "sent".to_string();
                                        }
                                        Err(e) => {
                                            response.data =
                                                serde_json::json!({"message": e.to_string()})
                                        }
                                    }
                                } else {
                                    response.data = serde_json::json!({"message": "Wrong type or empty content".to_string()})
                                }
                            } else {
                                response.data = serde_json::json!({"message": "Data must include type and content"});
                            }
                        }
                    }

                    Event::Leave => {
                        response.event = Event::Leave;
                        match chat_server_handler
                            .leave_converstaion(user_id, conn_id)
                            .await
                        {
                            Ok(_) => {
                                response.status = "left".to_string();
                            }
                            Err(e) => response.data = serde_json::json!({"message": e.to_string()}),
                        }
                    }

                    _ => {
                        response.data = serde_json::json!({"message": "Invalid event"});
                    }
                }
            }
            Err(e) => {
                log::error!("Text error: {e}");
                response.data = serde_json::json!({"message": "Invalid JSON format"});
            }
        }
        let _ = session.text(serde_json::json!(response).to_string()).await;
    }

    async fn process_receive_message(session: &mut actix_ws::Session, msg: &str) {
        session.text(msg).await.unwrap();
    }
}
