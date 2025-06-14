use actix_web::{web, Error, HttpRequest, HttpResponse, Result};
use tokio::task::spawn_local;
use uuid::Uuid;

use crate::ws::{chat_server_handler, ws_handler};

pub struct WSController;

impl WSController {
    pub fn routes(cfg: &mut web::ServiceConfig) {
        cfg.service(web::resource("/ws").route(web::get().to(Self::chat_ws)));
    }

    /// Handshake and start WebSocket
    async fn chat_ws(
        req: HttpRequest,
        stream: web::Payload,
        chat_server_handler: web::Data<chat_server_handler::ChatServerHandler>,
    ) -> Result<HttpResponse, Error> {
        let (res, session, msg_stream) = actix_ws::handle(&req, stream)?;

        // get user id from req
        let user_id = match req.headers().get("X-user-id").and_then(|v| v.to_str().ok()) {
            Some(id_str) => match Uuid::parse_str(id_str) {
                Ok(uuid) => uuid,
                Err(_) => return Ok(HttpResponse::Unauthorized().finish()),
            },
            None => return Ok(HttpResponse::Unauthorized().finish()),
        };

        // spawn websocket handler service
        spawn_local(ws_handler::WSHandler::handle_ws(
            (**chat_server_handler).clone(),
            session,
            msg_stream,
            user_id,
        ));

        Ok(res)
    }
}
