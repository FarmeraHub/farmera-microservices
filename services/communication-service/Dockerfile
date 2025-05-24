FROM rust:1.86-slim AS builder
WORKDIR /app

RUN apt-get update -qq && apt-get install -yqq musl-tools

COPY src/ src/
COPY migrations/ migrations/
COPY Cargo.toml .
COPY Cargo.lock .

RUN rustup target add x86_64-unknown-linux-musl && \
    cargo build --target x86_64-unknown-linux-musl --release

FROM alpine:latest

COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/communication-service /usr/local/bin
COPY --from=builder /app/migrations /app/migrations

WORKDIR /app

ENTRYPOINT ["/usr/local/bin/communication-service"]