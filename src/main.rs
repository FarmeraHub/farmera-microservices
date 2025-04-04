use std::env;

use actix_files::NamedFile;
use actix_web::{web::resource, App, HttpServer, Responder};
use dotenvy::dotenv;
use env_logger::Env;

async fn index() -> impl Responder {
    NamedFile::open_async("./static/index.html").await.unwrap()
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let server_addr = env::var("SERVER_ADDRESS").expect("SERVER_ADDRESS must be set");
    let server_port = env::var("SERVER_PORT").expect("SERVER_PORT must be set");

    HttpServer::new(|| App::new().service(resource("/").to(index)))
        .bind(format!("{server_addr}:{server_port}"))?
        .workers(1)
        .run()
        .await
}
