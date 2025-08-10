package ru.exegguto.aiadvent.chat.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
enum class MessageRole {
    @SerialName("user") USER,
    @SerialName("assistant") ASSISTANT,
    @SerialName("system") SYSTEM,
}

@Serializable
data class AssistantMessageParams(
    val modelId: String,
    val providerId: String = "dipseek",
    val temperature: Double? = null,
    val topP: Double? = null,
    val stop: List<String>? = null,
    val usagePromptTokens: Long? = null,
    val usageCompletionTokens: Long? = null,
    val usageTotalTokens: Long? = null,
    val finishReason: String? = null,
    val metadata: Map<String, String>? = null,
    val raw: JsonObject? = null,
)

@Serializable
data class Message(
    val id: String,
    val chatId: String,
    val role: MessageRole,
    val content: String,
    val createdAtEpochMs: Long,
    val assistantParams: AssistantMessageParams? = null,
)

@Serializable
data class Chat(
    val id: String,
    val title: String,
    val createdAtEpochMs: Long,
    val modelId: String,
    val messages: List<Message> = emptyList(),
)

@Serializable
data class ChatSummary(
    val id: String,
    val title: String,
    val lastUpdatedEpochMs: Long,
) 