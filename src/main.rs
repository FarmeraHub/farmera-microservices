use std::env;

use actix_files::NamedFile;
use actix_web::{web, App, HttpServer, Responder};
use controllers::ws_controller;
use dotenvy::dotenv;
use env_logger::Env;
use tokio::spawn;
use ws::chat_server::ChatServer;

mod controllers;
mod models;
mod services;
mod ws;

async fn index() -> impl Responder {
    NamedFile::open_async("./static/index.html").await.unwrap()
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let server_addr = env::var("SERVER_ADDRESS").expect("SERVER_ADDRESS must be set");
    let server_port = env::var("SERVER_PORT").expect("SERVER_PORT must be set");

    let (chat_server, chat_server_handler) = ChatServer::new();

    spawn(chat_server.run());

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(chat_server_handler.clone()))
            .service(web::resource("/").to(index))
            .configure(ws_controller::WSController::routes)
    })
    .bind(format!("{server_addr}:{server_port}"))?
    .workers(1)
    .run()
    .await
}
