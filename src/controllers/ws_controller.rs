use actix_web::{web, Error, HttpRequest, HttpResponse, Result};
use tokio::task::spawn_local;
use uuid::Uuid;

use crate::{services::ws_service, ws::chat_server_handler};

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

        // !TODO: get user id from req
        let user_id = Uuid::new_v4();

        // spawn websocket handler service
        spawn_local(ws_service::WSService::handle_ws(
            (**chat_server_handler).clone(),
            session,
            msg_stream,
            user_id,
        ));

        Ok(res)
    }
}
