#!/bin/bash
# Test script for Docker build
# Run this on the host where Docker is installed

set -e

echo "=== Testing Mission Control Docker Build ==="

cd "$(dirname "$0")"

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

# Check if docker compose is available
if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed"
    exit 1
fi

echo "Building Docker image..."
docker build -t mission-control-test . 

echo "=== Build successful! ==="
echo ""
echo "To run the container:"
echo "  docker compose up -d"
echo ""
echo "To test the build interactively:"
echo "  docker run -p 3001:3000 --rm mission-control-test"