Write-Host "Starting Prelegal..."
docker compose up -d --build
if ($LASTEXITCODE -eq 0) {
    Write-Host "Prelegal is running at http://localhost:8000"
} else {
    Write-Error "Failed to start Prelegal."
    exit 1
}
