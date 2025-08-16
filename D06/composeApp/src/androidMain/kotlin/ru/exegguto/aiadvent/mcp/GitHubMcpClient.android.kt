package ru.exegguto.aiadvent.mcp

import io.ktor.client.HttpClient
import io.modelcontextprotocol.kotlin.sdk.Implementation
import io.modelcontextprotocol.kotlin.sdk.client.Client
import io.modelcontextprotocol.kotlin.sdk.client.sse.SseClientTransport
import kotlinx.serialization.json.JsonObject
import ru.exegguto.aiadvent.BuildKonfig

actual suspend fun mcpRunTool(name: String, arguments: JsonObject): JsonObject {
    val base = BuildKonfig.MCP_GITHUB_SSE_URL
    require(base.isNotBlank()) { "MCP_GITHUB_SSE_URL is not set" }
    val url = resolveLocalhostForPlatform(base)
    val http = HttpClient()
    val client = Client(clientInfo = Implementation(name = "aiadvent-client", version = "1.0"))
    val transport = SseClientTransport(httpClient = http, urlString = url)
    client.connect(transport)
    val result = client.callTool(name, arguments)
    return result ?: JsonObject(emptyMap())
}


