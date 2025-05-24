# Regenerate gRPC code for Farmera microservices
Write-Host "🔄 Regenerating gRPC code..." -ForegroundColor Blue

# Generate Node.js code
Write-Host "Generating Node.js/TypeScript code..." -ForegroundColor Yellow
buf generate --template buf.gen.nodejs.yaml

# Generate Rust code
Write-Host "Generating Rust code..." -ForegroundColor Yellow
buf generate --template buf.gen.rust.yaml

Write-Host "✅ Code regeneration completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Generated files:" -ForegroundColor Cyan
Write-Host "- Node.js: ../generated/nodejs/" -ForegroundColor White
Write-Host "- Rust: ../generated/rust/src/" -ForegroundColor White 