#!/bin/bash

# Farmera Microservices gRPC Setup Script
# This script sets up the development environment for gRPC services

set -e

echo "🌾 Farmera Microservices gRPC Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check for buf
    if ! command -v buf &> /dev/null; then
        print_error "buf is not installed. Please install it from https://buf.build/docs/installation"
        exit 1
    fi
    
    # Check for protoc
    if ! command -v protoc &> /dev/null; then
        print_warning "protoc is not installed. Installing via package manager..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install protobuf
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update && sudo apt-get install -y protobuf-compiler
        else
            print_error "Please install protoc manually"
            exit 1
        fi
    fi
    
    # Check for Node.js (for TypeScript/JavaScript services)
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Please install it from https://nodejs.org/"
    fi
    
    # Check for Rust (for Rust services)
    if ! command -v cargo &> /dev/null; then
        print_warning "Rust is not installed. Please install it from https://rustup.rs/"
    fi
    
    print_success "Dependencies check completed"
}

# Generate gRPC code for Node.js services
generate_nodejs_code() {
    print_status "Generating gRPC code for Node.js services..."
    
    # Create output directories
    mkdir -p ../generated/nodejs/common
    mkdir -p ../generated/nodejs/users
    mkdir -p ../generated/nodejs/products
    mkdir -p ../generated/nodejs/payment
    mkdir -p ../generated/nodejs/notification
    mkdir -p ../generated/nodejs/communication
    
    # Generate using buf
    buf generate --template buf.gen.nodejs.yaml
    
    print_success "Node.js gRPC code generated"
}

# Generate gRPC code for Rust services
generate_rust_code() {
    print_status "Generating gRPC code for Rust services..."
    
    # Create output directories
    mkdir -p ../generated/rust/src
    
    # Generate using buf
    buf generate --template buf.gen.rust.yaml
    
    print_success "Rust gRPC code generated"
}

# Generate gRPC code for Go (if needed)
generate_go_code() {
    if [[ "$1" == "--go" ]]; then
        print_status "Generating gRPC code for Go..."
        
        # Create output directories
        mkdir -p ../generated/go
        
        # Generate using buf
        buf generate --template buf.gen.go.yaml
        
        print_success "Go gRPC code generated"
    fi
}

# Create Buf generation templates
create_buf_templates() {
    print_status "Creating Buf generation templates..."
    
    # Node.js template (using ts-proto for better NestJS integration)
    cat > buf.gen.nodejs.yaml << EOF
version: v2
plugins:
  - remote: buf.build/community/stephenh-ts-proto:v2.6.1
    out: ../generated/nodejs/nestjs/src
    opt:
      - nestJs=true
      - snakeToCamel=false
      - esModuleInterop=true
    # opt: useDate=false # use google.probuf.Timestamp {secs, nanos}
EOF

    # Rust template
    cat > buf.gen.rust.yaml << EOF
version: v1
plugins:
  - plugin: buf.build/community/neoeinstein-prost:v0.12.1
    out: ../generated/rust/src
    opt:
      - bytes=.
      - file_descriptor_set
  - plugin: buf.build/community/neoeinstein-prost-serde:v0.12.1
    out: ../generated/rust/src
  - plugin: buf.build/community/neoeinstein-tonic:v0.10.0
    out: ../generated/rust/src
    opt:
      - no_include
      - compile_well_known_types
EOF

    # Go template (optional)
    cat > buf.gen.go.yaml << EOF
version: v1
plugins:
  - plugin: buf.build/protocolbuffers/go:v1.31.0
    out: ../generated/go
    opt: paths=source_relative
  - plugin: buf.build/grpc/go:v1.3.0
    out: ../generated/go
    opt: paths=source_relative
EOF

    print_success "Buf templates created"
}

# Validate proto files
validate_protos() {
    print_status "Validating proto files..."
    
    # Lint proto files
    buf lint
    
    # Check for breaking changes (if previous version exists)
    if [ -d ".git" ]; then
        buf breaking --against '.git#branch=main'
    fi
    
    print_success "Proto files validated"
}

# Install Node.js dependencies for generated code
setup_nodejs_deps() {
    print_status "Setting up Node.js dependencies..."
    
    # Create package.json for generated code
    cat > ../generated/nodejs/package.json << EOF
{
  "name": "@farmera/grpc-client",
  "version": "1.0.0",
  "description": "Generated gRPC client code for Farmera microservices",
  "main": "index.js",
  "types": "index.d.ts",
  "dependencies": {
    "@grpc/grpc-js": "^1.9.0",
    "@grpc/proto-loader": "^0.7.8",
    "google-protobuf": "^3.21.0"
  },
  "devDependencies": {
    "@types/google-protobuf": "^3.15.0",
    "typescript": "^5.0.0"
  }
}
EOF

    # Install dependencies
    cd ../generated/nodejs && npm install
    cd ../../grpc-protos
    
    print_success "Node.js dependencies installed"
}

# Setup Rust dependencies for generated code
setup_rust_deps() {
    print_status "Setting up Rust dependencies..."
    
    # Create Cargo.toml for generated code
    cat > ../generated/rust/Cargo.toml << EOF
[package]
name = "farmera-grpc-proto"
version = "0.1.0"
edition = "2021"

[dependencies]
tonic = "0.10"
prost = "0.12"
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["macros", "rt-multi-thread"] }

[build-dependencies]
tonic-build = "0.10"
EOF

    # Create lib.rs
    cat > ../generated/rust/src/lib.rs << EOF
//! Generated gRPC code for Farmera microservices
//!
//! This crate contains all the generated protobuf and gRPC code
//! for the Farmera microservices ecosystem.

pub mod common {
    include!("farmera.common.rs");
}

pub mod users {
    include!("farmera.users.rs");
}

pub mod products {
    include!("farmera.products.rs");
}

pub mod payment {
    include!("farmera.payment.rs");
}

pub mod notification {
    include!("farmera.notification.rs");
}

pub mod communication {
    include!("farmera.communication.rs");
}

// Re-export commonly used types
pub use common::*;
EOF

    print_success "Rust dependencies setup"
}

# Create development scripts
create_dev_scripts() {
    print_status "Creating development scripts..."
    
    # Create regenerate script
    cat > regenerate.sh << 'EOF'
#!/bin/bash
echo "🔄 Regenerating gRPC code..."
buf generate --template buf.gen.nodejs.yaml
buf generate --template buf.gen.rust.yaml
echo "✅ Code regeneration completed"
EOF
    chmod +x regenerate.sh
    
    # Create watch script
    cat > watch.sh << 'EOF'
#!/bin/bash
echo "👀 Watching for proto file changes..."
if command -v fswatch &> /dev/null; then
    fswatch -o . | xargs -n1 -I{} ./regenerate.sh
else
    echo "Install fswatch for file watching: brew install fswatch (macOS) or apt-get install fswatch (Ubuntu)"
fi
EOF
    chmod +x watch.sh
    
    print_success "Development scripts created"
}

# Main execution
main() {
    print_status "Starting Farmera gRPC setup..."
    
    # Run setup steps
    check_dependencies
    create_buf_templates
    validate_protos
    generate_nodejs_code
    generate_rust_code
    generate_go_code "$@"
    setup_nodejs_deps
    setup_rust_deps
    create_dev_scripts
    
    print_success "🎉 Farmera gRPC setup completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Run './regenerate.sh' to regenerate code after proto changes"
    echo "2. Run './watch.sh' to automatically regenerate on file changes"
    echo "3. Check the generated code in '../generated/' directory"
    echo "4. Start implementing your gRPC services!"
    echo
    echo "Documentation: See README.md for detailed implementation guide"
}

# Run main function with all arguments
main "$@" 