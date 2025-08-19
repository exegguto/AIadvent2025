#!/bin/bash

echo "📋 Логи D09 MCP Reporter"
echo ""

# Проверяем аргументы
if [ "$1" = "follow" ] || [ "$1" = "-f" ]; then
    echo "🔍 Логи MCP Reporter (реальное время):"
    docker-compose logs -f mcp-reporter
else
    echo "🔍 Логи MCP Reporter:"
    echo "  Использование:"
    echo "    ./docker-logs.sh          - логи MCP Reporter"
    echo "    ./docker-logs.sh follow   - логи в реальном времени"
    echo "    ./docker-logs.sh -f       - логи в реальном времени"
    echo ""
    docker-compose logs mcp-reporter
fi
