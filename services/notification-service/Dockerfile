FROM clux/muslrust:stable AS builder
WORKDIR /app

RUN apt update &&  apt install -y g++ && \
    ln -s $(which g++) /usr/bin/x86_64-linux-musl-g++

COPY Cargo.toml .
COPY Cargo.lock .

RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release || true

COPY src/ src/
COPY migrations/ migrations/

RUN cargo build --release

FROM alpine

RUN apk add --no-cache libgcc

COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/notification-service /usr/local/bin
COPY --from=builder /app/migrations /app/migrations

WORKDIR /app

ENTRYPOINT ["/usr/local/bin/notification-service"]
