# Farmera Notification Service

This repository provides a Notification Gateway service for Farmera Application

Supporting Firebase Push, Email (SendGrid), and may be more (in the future :v), powered by Kafka and PostgreSQL.

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
