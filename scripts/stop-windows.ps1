Write-Host "Stopping Prelegal..."
docker compose down
if ($LASTEXITCODE -eq 0) {
    Write-Host "Prelegal stopped."
} else {
    Write-Error "Failed to stop Prelegal."
    exit 1
}
