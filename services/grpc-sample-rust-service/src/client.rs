use farmera_grpc_proto::hello::{HelloRequest, greeter_client::GreeterClient};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut client = GreeterClient::connect("http://[::1]:50051").await?;

    // Unary RPC: SayHello
    let request = tonic::Request::new(HelloRequest {
        name: "Alice".into(),
    });

    let response = client.say_hello(request).await?;
    println!("Unary Response: {}", response.into_inner().message);

    Ok(())
}
