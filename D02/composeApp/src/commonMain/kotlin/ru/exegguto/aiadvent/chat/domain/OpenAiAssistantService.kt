package ru.exegguto.aiadvent.chat.domain

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.HttpClientEngine
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.longOrNull
import ru.exegguto.aiadvent.BuildKonfig
import ru.exegguto.aiadvent.chat.data.AssistantMessageParams
import ru.exegguto.aiadvent.chat.data.Message
import ru.exegguto.aiadvent.chat.data.MessageRole

class OpenAiAssistantService(
    private val apiKeyOverride: String? = null,
    private val engine: HttpClientEngine? = null,
) : AssistantService {

    private val http: HttpClient = if (engine != null) {
        HttpClient(engine) {
            install(ContentNegotiation) { json(Json { ignoreUnknownKeys = true }) }
        }
    } else {
        HttpClient {
            install(ContentNegotiation) { json(Json { ignoreUnknownKeys = true }) }
        }
    }

    @Serializable
    private data class ChatRequest(
        val model: String,
        val messages: List<ChatMessage>,
    )

    @Serializable
    private data class ChatMessage(
        val role: String,
        val content: String
    )

    private fun mapRole(role: MessageRole): String = when (role) {
        MessageRole.USER -> "user"
        MessageRole.ASSISTANT -> "assistant"
        MessageRole.SYSTEM -> "system"
    }

    override suspend fun sendMessage(
        modelId: String,
        messages: List<Message>,
        userInput: String,
    ): Pair<String, AssistantMessageParams> {
        val key = apiKeyOverride?.ifBlank { null } ?: BuildKonfig.OPENAI_API_KEY
        require(key.isNotBlank()) { "OPENAI_API_KEY not set" }

        val url = BuildKonfig.OPENAI_BASE_URL.trimEnd('/') + "/v1/chat/completions"

        val history = buildList {
            add(ChatMessage("system", "Отвечай строго в формате JSON без markdown и лишнего текста. Схема ответа: {\"answer\": string, \"points\": string[], \"summary\": string}. Пример: {\"answer\": \"краткий ответ\", \"points\":[\"шаг размышления 1\",\"шаг размышления 2\"], \"summary\": \"итог\"}. Если данных не хватает — возвращай данные так, чтобы JSON был валидным."))
            messages.forEach { msg ->
                add(ChatMessage(mapRole(msg.role), msg.content))
            }
        }

        val payload = ChatRequest(
            model = modelId,
            messages = history,
        )

        val response = http.post(url) {
            header("Authorization", "Bearer $key")
            contentType(ContentType.Application.Json)
            setBody(payload)
        }

        val raw = response.body<JsonObject>()
        val outputText = raw["choices"]
            ?.jsonArray?.getOrNull(0)
            ?.jsonObject?.get("message")
            ?.jsonObject?.get("content")
            ?.jsonPrimitive?.contentOrNull
            ?: raw.toString()

        val usage = raw["usage"]?.jsonObject

        // Try to parse assistant content (expected JSON)
        val parsedStructured: JsonObject? = runCatching {
            Json.parseToJsonElement(outputText).jsonObject
        }.getOrNull()

        val params = AssistantMessageParams(
            modelId = modelId,
            providerId = "openai",
            usagePromptTokens = usage?.get("prompt_tokens")?.jsonPrimitive?.longOrNull,
            usageCompletionTokens = usage?.get("completion_tokens")?.jsonPrimitive?.longOrNull,
            usageTotalTokens = usage?.get("total_tokens")?.jsonPrimitive?.longOrNull,
            raw = raw,
            structured = parsedStructured,
        )
        return outputText to params
    }
} 