package ru.exegguto.aiadvent.mcp

import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.put
import ru.exegguto.aiadvent.BuildKonfig

class GitHubMcpClient(
    private val json: Json = Json { ignoreUnknownKeys = true }
) {
    suspend fun listRepos(): Pair<Int, List<String>> {
        val result = runViaMcpOrThrow("github.listRepos", JsonObject(emptyMap()))
        val items = result["items"]?.let { json.decodeFromJsonElement(ListSerializer(String.serializer()), it) } ?: emptyList()
        return items.size to items
    }

    suspend fun listIssues(owner: String, repo: String): Pair<Int, List<String>> {
        val args = buildJsonObject {
            put("owner", owner)
            put("repo", repo)
        }
        val result = runViaMcpOrThrow("github.listIssues", args)
        val items = result["items"]?.let { json.decodeFromJsonElement(ListSerializer(String.serializer()), it) } ?: emptyList()
        return items.size to items
    }

    suspend fun listPulls(owner: String, repo: String): Pair<Int, List<String>> {
        val args = buildJsonObject {
            put("owner", owner)
            put("repo", repo)
        }
        val result = runViaMcpOrThrow("github.listPulls", args)
        val items = result["items"]?.let { json.decodeFromJsonElement(ListSerializer(String.serializer()), it) } ?: emptyList()
        return items.size to items
    }

    private suspend fun runViaMcpOrThrow(tool: String, args: JsonObject): JsonObject {
        require(BuildKonfig.MCP_GITHUB_SSE_URL.isNotBlank()) { "MCP_GITHUB_SSE_URL is not set" }
        return mcpRunTool(tool, args)
    }
}

expect suspend fun mcpRunTool(name: String, arguments: JsonObject): JsonObject

fun resolveLocalhostForPlatform(url: String): String {
    if (url.isBlank()) return url
    // Android emulator maps host loopback to 10.0.2.2
    return if (PlatformDetector.isAndroid && url.startsWith("http://localhost:")) {
        url.replace("http://localhost:", "http://10.0.2.2:")
    } else url
}

object PlatformDetector {
    val isAndroid: Boolean = PlatformTag.tag == "android"
}

expect object PlatformTag { val tag: String }


