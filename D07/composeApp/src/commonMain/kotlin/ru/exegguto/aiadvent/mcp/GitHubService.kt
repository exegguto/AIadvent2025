package ru.exegguto.aiadvent.mcp

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.parameter
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import ru.exegguto.aiadvent.BuildKonfig

object GitHubService {
    private val http = HttpClient {
        install(ContentNegotiation) { json(Json { ignoreUnknownKeys = true }) }
    }

    suspend fun listRepos(): Pair<Int, List<String>> {
        val token = requireToken()
        val res: JsonArray = http.get("https://api.github.com/user/repos") {
            header("Authorization", "Bearer $token")
            parameter("per_page", 100)
        }.body()
        val names = res.mapNotNull { (it as? JsonObject)?.get("name")?.jsonPrimitive?.content }
        return names.size to names
    }

    suspend fun listIssues(owner: String, repo: String): Pair<Int, List<String>> {
        val token = requireToken()
        val url = "https://api.github.com/repos/$owner/$repo/issues"
        val res: JsonArray = http.get(url) {
            header("Authorization", "Bearer $token")
            parameter("state", "open")
            parameter("per_page", 100)
        }.body()
        val titles = res.mapNotNull { (it as? JsonObject)?.get("title")?.jsonPrimitive?.content }
        return titles.size to titles
    }

    suspend fun listPulls(owner: String, repo: String): Pair<Int, List<String>> {
        val token = requireToken()
        val url = "https://api.github.com/repos/$owner/$repo/pulls"
        val res: JsonArray = http.get(url) {
            header("Authorization", "Bearer $token")
            parameter("state", "open")
            parameter("per_page", 100)
        }.body()
        val titles = res.mapNotNull { (it as? JsonObject)?.get("title")?.jsonPrimitive?.content }
        return titles.size to titles
    }

    private fun requireToken(): String {
        val token = BuildKonfig.GITHUB_TOKEN
        require(token.isNotBlank()) { "GITHUB_TOKEN not set" }
        return token
    }
}
