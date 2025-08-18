#!/bin/bash

# Проверяем наличие GITHUB_PAT
if [ -z "$GITHUB_PAT" ]; then
    echo "Warning: GITHUB_PAT not set. Using default token."
    export GITHUB_PAT=github_pat_xxx
fi

echo "Starting GitHub MCP server and reporter..."

# Запускаем GitHub MCP сервер как подпроцесс
echo "Starting GitHub MCP server..."
docker run --rm -i \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_PAT \
  ghcr.io/github/github-mcp-server &

# Ждем чтобы сервер запустился
echo "Waiting for MCP server to start..."
sleep 5

# Запускаем наше приложение
echo "Starting MCP reporter..."
exec node src/index.js
