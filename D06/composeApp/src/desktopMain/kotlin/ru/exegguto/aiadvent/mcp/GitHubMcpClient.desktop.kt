package ru.exegguto.aiadvent.mcp

import io.ktor.client.HttpClient
import io.ktor.client.engine.okhttp.OkHttp
import io.modelcontextprotocol.kotlin.sdk.Implementation
import io.modelcontextprotocol.kotlin.sdk.client.Client
import io.modelcontextprotocol.kotlin.sdk.client.sse.SseClientTransport
import kotlinx.serialization.json.JsonObject
import ru.exegguto.aiadvent.BuildKonfig

actual suspend fun mcpRunTool(name: String, arguments: JsonObject): JsonObject {
    val base = BuildKonfig.MCP_GITHUB_SSE_URL
    require(base.isNotBlank()) { "MCP_GITHUB_SSE_URL is not set" }
    val client = Client(clientInfo = Implementation(name = "aiadvent-desktop", version = "1.0"))
    val http = HttpClient(OkHttp)
    val transport = SseClientTransport(httpClient = http, urlString = base)
    client.connect(transport)
    return client.callTool(name, arguments) ?: JsonObject(emptyMap())
}


