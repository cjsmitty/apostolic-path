#!/bin/bash

# Local Development Setup Script
# Run this after cloning the repository

set -e

echo "🚀 Setting up Apostolic Path development environment..."

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required. Install with: npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "⚠️ Docker is recommended for local AWS services."; }

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Copy environment files
echo "📝 Setting up environment files..."
if [ ! -f apps/api/.env ]; then
  cp apps/api/.env.example apps/api/.env
  echo "   Created apps/api/.env"
fi

if [ ! -f apps/web/.env.local ]; then
  cp apps/web/.env.example apps/web/.env.local
  echo "   Created apps/web/.env.local"
fi

# Start local services
if command -v docker >/dev/null 2>&1; then
  echo "🐳 Starting local AWS services (DynamoDB, S3)..."
  docker-compose up -d dynamodb-local localstack

  # Wait for DynamoDB to be ready
  echo "⏳ Waiting for DynamoDB to be ready..."
  sleep 3

  # Create tables
  echo "📊 Creating DynamoDB tables..."
  pnpm --filter @apostolic-path/database seed || echo "   Tables may already exist"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "  pnpm dev"
echo ""
echo "Services will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  API:      http://localhost:3001"
echo "  API Docs: http://localhost:3001/docs"
echo ""
echo "Local AWS services (if Docker is running):"
echo "  DynamoDB:       http://localhost:8000"
echo "  DynamoDB Admin: http://localhost:8001"
echo "  LocalStack:     http://localhost:4566"
