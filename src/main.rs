use std::env;

use actix_web::{App, HttpServer};
use dotenvy::dotenv;
use env_logger::Env;

pub mod config;
pub mod controllers;
pub mod errors;
pub mod models;
pub mod repositories;
pub mod services;
pub mod utils;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let server_addr = env::var("SERVER_ADDRESS").expect("SERVER_ADDRESS must be set");
    let server_port = env::var("SERVER_PORT").expect("SERVER_PORT must be set");

    HttpServer::new(|| App::new())
        .bind(format!("{server_addr}:{server_port}"))?
        .run()
        .await
}
