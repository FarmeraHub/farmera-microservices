#!/bin/bash

# Farmera Microservices gRPC Setup Script
# This script sets up the development environment for gRPC services

set -e

echo "Farmera Microservices gRPC Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get absolute path of script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Define generated folders
OUT_DIR_NODEJS="$SCRIPT_DIR/../shared/generated/nodejs"
OUT_DIR_RUST="$SCRIPT_DIR/../shared/generated/rust"
RUST_TEMPLATE_DIR="$SCRIPT_DIR/../shared/grpc-templates/rust"
NODEJS_TEMPLATE_DIR="$SCRIPT_DIR/../shared/grpc-templates/nodejs"


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

    cd "$SCRIPT_DIR/../shared/grpc-protos/"

    # Generate using buf
    buf generate --template buf.gen.nodejs.yaml
    
    print_success "Node.js gRPC code generated"
}

# Generate gRPC code for Rust services
generate_rust_code() {
    print_status "Generating gRPC code for Rust services..."
    
    cd "$SCRIPT_DIR/../shared/grpc-protos/"
    
    # Generate using buf
    buf generate --template buf.gen.rust.yaml
    
    print_success "Rust gRPC code generated"
}

# Validate proto files
validate_protos() {
    cd "$SCRIPT_DIR/../shared/grpc-protos/"

    print_status "Validating proto files..."

    # Run buf lint
    if ! buf lint; then
        print_warning "Proto linting found issues."

        read -p "Do you want to continue despite the linting issues? (y/N): " choice
        case "$choice" in
            y|Y ) print_status "Continuing despite lint warnings...";;
            * ) print_error "Aborting due to linting issues."; exit 1;;
        esac
    fi

    # Run buf breaking (if git exists)
    if [ -d ".git" ]; then
        if ! buf breaking --against '.git#branch=main'; then
            print_warning "Breaking changes detected."

            read -p "Continue despite breaking changes? (y/N): " choice
            case "$choice" in
                y|Y ) print_status "Continuing despite breaking changes...";;
                * ) print_error "Aborting due to breaking changes."; exit 1;;
            esac
        fi
    fi

    print_success "Proto files validated"
}


# Install Node.js dependencies for generated code
setup_nodejs_deps() {
    print_status "Setting up Node.js dependencies..."

    # Copy package.json from template
    cp "$NODEJS_TEMPLATE_DIR/package.json" "$OUT_DIR_NODEJS/package.json"
    cp "$NODEJS_TEMPLATE_DIR/index.ts" "$OUT_DIR_NODEJS/src/index.ts"
    cp "$NODEJS_TEMPLATE_DIR/tsconfig.json" "$OUT_DIR_NODEJS/tsconfig.json"


    # Install dependencies
    cd $OUT_DIR_NODEJS && npm install
    
    print_success "Node.js dependencies installed"
}

# Setup Rust dependencies for generated code
setup_rust_deps() {
    print_status "Setting up Rust dependencies..."

    mkdir -p "$OUT_DIR_RUST/src"

    # Copy Cargo.toml and lib.rs from template
    cp "$RUST_TEMPLATE_DIR/Cargo-template.toml" "$OUT_DIR_RUST/Cargo.toml"
    cp "$RUST_TEMPLATE_DIR/lib-template.rs" "$OUT_DIR_RUST/src/lib.rs"

    print_success "Rust dependencies setup"
}

# Create development scripts
create_dev_scripts() {
    print_status "Creating development scripts..."
    
    cd "$SCRIPT_DIR"

    # Create regenerate script
    cat > regenerate.sh << 'EOF'
#!/bin/bash

# This script regenerates gRPC code for Farmera microservices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get absolute path of script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR/../shared/grpc-protos"

echo "Regenerating gRPC code..."
buf generate --template buf.gen.nodejs.yaml
buf generate --template buf.gen.rust.yaml
echo "Code regeneration completed"
EOF
    chmod +x regenerate.sh
    
    print_success "Development scripts created"
}

# Main execution
main() {
    print_status "Starting Farmera gRPC setup..."
    
    # Run setup steps
    check_dependencies
    validate_protos
    generate_nodejs_code
    generate_rust_code
    setup_nodejs_deps
    setup_rust_deps
    create_dev_scripts
    
    print_success "Farmera gRPC setup completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Run './tools/regenerate.sh' to regenerate code after proto changes"
    echo "2. Check the generated code in './shared/generated/' directory"
    echo "3. Start implementing your gRPC services!"
    echo
    echo "Documentation: See README.md for detailed implementation guide"
}

# Run main function with all arguments
main "$@" 