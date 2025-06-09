# Farmera gRPC Tools

This directory contains scripts to set up and manage the gRPC development environment for the Farmera microservices project. These tools facilitate the generation of gRPC code, dependency management, and automation for proto file changes.

## Prerequisites

Before using these scripts, ensure the following tools are installed:

- **buf**: For linting, validating, and generating gRPC code. Install it from [buf.build/docs/installation](https://buf.build/docs/installation).
- **protoc**: Protocol Buffers compiler. Install it from [protobuf.dev/installation](https://protobuf.dev/installation/).
- **Node.js**: Required for TypeScript/JavaScript services. Install from [nodejs.org](https://nodejs.org/).
- **Rust**: Required for Rust services. Install from [rustup.rs](https://rustup.rs/).

## Scripts

### `setup.sh`

This script sets up the gRPC development environment by performing the following tasks:

- Checks for required dependencies (buf, protoc, Node.js, Rust).
- Validates proto files in `../shared/grpc-protos/` using `buf lint` and checks for breaking changes (if a Git repository is present).
- Generates gRPC code for Node.js and Rust services in `../shared/generated/nodejs` and `../shared/generated/rust`, respectively.
- Installs Node.js dependencies and creates a `package.json` for the generated Node.js code.
- Sets up Rust dependencies by copying template `Cargo.toml` and `lib.rs` files.
- Creates development scripts (`regenerate.sh`).

**Usage**:
```bash
./setup.sh
```

**Output**:
- Generated code in `../shared/generated/`.
- Development scripts (`regenerate.sh`) in the `tools` directory.
- Instructions for next steps, including how to regenerate code and implement services.

### `regenerate.sh`

This script regenerates gRPC code for both Node.js and Rust services when proto files are modified. It runs `buf generate` with the appropriate templates (`buf.gen.nodejs.yaml` and `buf.gen.rust.yaml`) in the `../shared/grpc-protos/` directory.

**Usage**:
```bash
./regenerate.sh
```

**Output**:
- Updated gRPC code in `../shared/generated/nodejs` and `../shared/generated/rust`.


## Directory Structure

```
tools/
├── setup.sh           # Main setup script for gRPC environment
├── regenerate.sh      # Script to regenerate gRPC code
├── README.md          # This file
└──...
```

## Next Steps

1. Run `./setup.sh` to initialize the gRPC environment.
2. Use `./regenerate.sh` to manually regenerate code after modifying proto files in `../shared/grpc-protos/`.
4. Check generated code in `../shared/generated/` for Node.js and Rust services.
5. Implement your gRPC services using the generated code.

## Notes

- Ensure all dependencies are installed before running `setup.sh`.
- If proto file validation fails (e.g., linting issues or breaking changes), the scripts will prompt for confirmation to continue.
- Generated code is organized by service type (e.g., `common`, `users`, `products`) for Node.js and in a single `src` directory for Rust.
- For detailed implementation guidance, refer to the project’s main documentation or contact the development team.

## How to Use Generated Proto Objects

### Nodejs/Nestjs

#### 1. Dependencies setup

##### **⚠️ Option 1: Using `file:` dependencies (not recommended)**

In package.json, you might be tempted to include your shared gRPC library like this:

```json
"dependencies": {
  "@farmera/grpc-proto": "file:../../shared/generated/nodejs/nestjs/dist"
}
```
This works, but it has significant drawbacks during active development:

- You must manually rebuild the library (tsc or other build command).

- Every time the .proto file changes, the library will change, and you must run npm install again to sync the changes.

The dependency is treated as a static snapshot, not a live source — meaning changes in the original folder will not automatically reflect in your project.

##### **✅ Option 2: Using npm link (recommended for local development)**

To make development easier and avoid manual syncing, use npm link to symlink the local package:

In the shared library folder:
```bash
cd ./shared/generated/nodejs/nestjs

# Run the build script if the library has not been built yet.
npm run build

# Note: This folder is built automatically when running setup.sh.

# Create a global symlink to this package.
npm link
```
In your NestJS project

```bash
cd ./service/your-service

npm link @farmera/grpc-proto
```

This will create a symbolic link to the shared package, allowing:

- Instant reflection of code changes after rebuilds.

- No need to reinstall dependencies after each change.

- Better developer experience when iterating on both projects.

#### 2. Usage

The generated objects in `shared/generated/nodejs/nestjs` can be use like this:

```TypeScript
import { CreateUserRequest, CreateUserResponse } from '@farmera/grpc-proto/dist/users/users';

const req = CreateUserRequest.fromPartial({
  username: "john_doe",
});

const res: CreateUserResponse = {
  success: true,
  message: `User ${req.username} created`,
};
```

### Rust

Add the following to your `Cargo.toml`:

```toml
farmera-grpc-proto = { path = "../../shared/generated/rust" }
```

Then use the generated request/response objects like so:
```rust
use farmera_grpc_proto::farmera::users::{CreateUserRequest, CreateUserResponse};

fn handle_create_user(req: CreateUserRequest) -> CreateUserResponse {
    let username = req.username;

    CreateUserResponse {
        success: true,
        message: format!("User {} created", username),
        ..Default::default()
    }
}
```

Notes:

- If your message includes types like Timestamp, make sure prost-types is added to your dependencies.






