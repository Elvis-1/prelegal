#!/bin/bash
set -e

echo "Starting Prelegal..."
docker compose up -d --build
echo "Prelegal is running at http://localhost:8000"
