use actix_web::{App, HttpServer, web};
use farmera_grpc_proto::hello::{
    HelloReply, HelloRequest,
    greeter_server::{Greeter, GreeterServer},
};
use tokio::sync::oneshot;
use tonic::transport::Server;

#[derive(Debug, Default)]
pub struct MyGreeter {}

#[tonic::async_trait]
impl Greeter for MyGreeter {
    async fn say_hello(
        &self,
        request: tonic::Request<HelloRequest>,
    ) -> Result<tonic::Response<HelloReply>, tonic::Status> {
        println!("Got a request: {:?}", request);
        let name = request.into_inner().name;
        let reply = HelloReply {
            message: format!("Hello, {}!", name),
        };

        Ok(tonic::Response::new(reply))
    }
}

async fn index(name: web::Path<String>) -> impl actix_web::Responder {
    format!("Hello, {}!", name.into_inner())
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let (tx, rx) = oneshot::channel();

    tokio::spawn(async move {
        let addr = "[::1]:50051".parse().unwrap();
        let greeter = MyGreeter::default();

        println!("Server listening on {}", addr);

        Server::builder()
            .add_service(GreeterServer::new(greeter))
            .serve_with_shutdown(addr, async {
                rx.await.ok();
            })
            .await
            .unwrap();
    });

    HttpServer::new(|| App::new().route("/", web::get().to(index)))
        .bind("127.0.0.1:8080")?
        .run()
        .await?;

    let _ = tx.send(());

    Ok(())
}
