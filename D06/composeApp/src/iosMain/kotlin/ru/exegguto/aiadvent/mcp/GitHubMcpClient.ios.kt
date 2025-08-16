package ru.exegguto.aiadvent.mcp

import kotlinx.serialization.json.JsonObject

actual suspend fun mcpRunTool(name: String, arguments: JsonObject): JsonObject {
    throw UnsupportedOperationException("MCP SSE on iOS disabled (ktor-client-sse not available). Use REST or Android MCP.")
}


