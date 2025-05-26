# Regenerate gRPC code
Write-Host "ðŸ”„ Regenerating gRPC code..." -ForegroundColor Blue
buf generate --template buf.gen.nodejs.yaml
buf generate --template buf.gen.rust.yaml
Write-Host "âœ… Code regeneration completed" -ForegroundColor Green
