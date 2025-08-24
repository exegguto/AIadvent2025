#!/bin/bash

echo "🚀 Cursor-like Code Executor - Quick Start"
echo "=========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Check Docker status
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating configuration file..."
    cp env.example .env
    echo "⚠️  Please edit .env file and add your OpenAI API key"
fi

# Check if OpenAI API key is set
if [ ! -f .env ] || ! grep -q "OPENAI_API_KEY=sk-" .env; then
    echo "⚠️  Warning: OpenAI API key not found in .env file"
    echo "💡 Add your OpenAI API key to .env file:"
    echo "   OPENAI_API_KEY=sk-your-actual-key-here"
    echo ""
    echo "The system will work but with limited functionality."
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

# Start the server
echo "🚀 Starting server..."
echo "📱 Web interface will be available at: http://localhost:3010"
echo "📚 API documentation: http://localhost:3010/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
