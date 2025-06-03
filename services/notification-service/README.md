# Farmera Notification Service

This repository provides a Notification Gateway service for Farmera Application

Supporting Firebase Push, Email (SendGrid), and may be more (in the future :v), powered by Kafka and PostgreSQL.

## Quick Start

You can launch the Notification Service in three modes: **HTTP Server**, **gRPC Server**, or **Hybrid Server**.

### 1. HTTP Server

Start the HTTP REST API with Swagger UI:

```bash
cargo run --bin main
```

* Default address: [http://localhost:3004](http://localhost:3004)
* Swagger UI: [http://localhost:3004/swagger-ui/](http://localhost:3004/swagger-ui/)

### 2. gRPC Server

Start the gRPC server:

```bash
cargo run --bin grpc-server
```

* gRPC port: `50051`

### 3. Hybrid Server

Run both HTTP and gRPC servers together:

```bash
cargo run --bin hybrid-server
```

* HTTP port: `8090`
* gRPC port: `50051`

Tip: Use the hybrid server mode for maximum compatibility and easier development/testing.


# Docker Compose Setup

## Prerequisites

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

## Environment Configuration

Ensure the following environment variables are set in your `docker-compose.yml` file:

```yaml
environment:
  - FCM_PROJECT_ID=<your_fcm_project_id>
  - SENDGRID_API_KEY=<your_api_key>
```

Mount your Firebase credentials JSON file to the container:

```yaml
volumes:
  - <path to GOOGLE APPLICATION CREDENTIALS json file>:/app/creds.json
```

## Run the Services

To build and start all services:

```bash
docker compose up --build
```

This will launch the application along with required services like Kafka and PostgreSQL.

## ⚠️ Kafka Startup Delay (Important!)

If the application fails to connect to Kafka on startup (due to Kafka being slow to boot), you can add a delay to the start of the application.

In `main.rs`, uncomment the following line:

```rust
// tokio::time::sleep(std::time::Duration::from_secs(10)).await;
```

You can also increase the duration if needed (e.g., to 20 seconds):

```rust
tokio::time::sleep(std::time::Duration::from_secs(20)).await;
```

This ensures the app waits for Kafka to be fully ready before trying to connect.

---

