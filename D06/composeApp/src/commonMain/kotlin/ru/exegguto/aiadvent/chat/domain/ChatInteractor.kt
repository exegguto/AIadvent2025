package ru.exegguto.aiadvent.chat.domain

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.flow
import ru.exegguto.aiadvent.chat.data.Chat
import ru.exegguto.aiadvent.chat.data.Message
import ru.exegguto.aiadvent.chat.data.MessageRole
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import ru.exegguto.aiadvent.chat.data.AssistantMessageParams
import ru.exegguto.aiadvent.mcp.GitHubMcpClient
import ru.exegguto.aiadvent.mcp.GitHubService

class ChatInteractor(
    private val repository: ChatRepository,
    private val assistant: AssistantService,
) {
    suspend fun newChat(modelId: String): String {
        val chat = repository.createChat(initialTitle = "Новый чат", modelId = modelId)
        return chat.id
    }

    fun sendUserMessageStream(chatId: String, text: String, modelId: String): Flow<Chat> = flow {
        val userMessage = Message(
            id = generateId(),
            chatId = chatId,
            role = MessageRole.USER,
            content = text,
            createdAtEpochMs = now(),
        )
        val afterUser = repository.appendMessage(chatId, userMessage)
        emit(afterUser)

        val assistantMessageId = generateId()
        // create placeholder assistant message to be filled by stream
        val afterPlaceholder = repository.appendMessage(
            chatId,
            Message(
                id = assistantMessageId,
                chatId = chatId,
                role = MessageRole.ASSISTANT,
                content = "",
                createdAtEpochMs = now(),
            )
        )
        emit(afterPlaceholder)

        var finalText = ""
        assistant.streamMessage(modelId, afterUser.messages, text).collect { event ->
            when (event) {
                is AssistantStreamEvent.Delta -> {
                    finalText += event.textDelta
                    val updated = repository.updateMessageContent(chatId, assistantMessageId, finalText)
                    emit(updated)
                }
                is AssistantStreamEvent.Completed -> {
                    // keep the original assistant message as the LLM's final content
                    val structured = event.params.structured
                    val hasMcp = (structured?.get("mcp") as? kotlinx.serialization.json.JsonObject) != null

                    if (hasMcp) {
                        // 1) persist the intermediate LLM message as-is and mark it
                        finalText = event.fullText
                        val paramsMarked = event.params.copy(
                            metadata = (event.params.metadata ?: emptyMap()) + mapOf(
                                "phase" to "mcp-request"
                            )
                        )
                        var afterMark = repository.updateMessageContent(chatId, assistantMessageId, finalText)
                        afterMark = repository.updateMessageParams(chatId, assistantMessageId, paramsMarked)
                        emit(afterMark)

                        // 2) fetch via MCP/REST and append a second assistant message with the result
                        val mcpReq = structured?.get("mcp") as kotlinx.serialization.json.JsonObject
                        val target = mcpReq["target"]?.jsonPrimitive?.content
                        val owner = mcpReq["owner"]?.jsonPrimitive?.content
                        val repoName = mcpReq["repo"]?.jsonPrimitive?.content
                        val (count, items) = tryFetchGithub(target ?: "", owner, repoName)
                        val listText = buildString {
                            append("count: ")
                            append(count)
                            append('\n')
                            items.forEach { append("- ").append(it).append('\n') }
                        }
                        val resultParams = event.params.copy(
                            metadata = (event.params.metadata ?: emptyMap()) + mapOf(
                                "source" to "github",
                                "phase" to "mcp-result"
                            ),
                            structured = null
                        )
                        val afterAppend = repository.appendMessage(
                            chatId,
                            Message(
                                id = generateId(),
                                chatId = chatId,
                                role = MessageRole.ASSISTANT,
                                content = listText,
                                createdAtEpochMs = now(),
                                assistantParams = resultParams
                            )
                        )
                        emit(afterAppend)
                    } else {
                        // no MCP: just finalize the single assistant message
                        finalText = event.fullText
                        var updated = repository.updateMessageContent(chatId, assistantMessageId, finalText)
                        updated = repository.updateMessageParams(chatId, assistantMessageId, event.params)
                        emit(updated)
                    }
                }
            }
        }
    }

    suspend fun sendUserMessage(chatId: String, text: String, modelId: String) {
        sendUserMessageStream(chatId, text, modelId).collect { _ -> }
    }

    private fun generateId(): String = "m-" + now().toString()
    private fun now(): Long = kotlinx.datetime.Clock.System.now().toEpochMilliseconds()

    private suspend fun handleAssistantCompleted(event: AssistantStreamEvent.Completed): Pair<String, AssistantMessageParams> {
        var outText = event.fullText
        var outParams: AssistantMessageParams = event.params
        val structured = event.params.structured
        val mcpReq = (structured?.get("mcp") as? JsonObject)
        if (mcpReq != null) {
            val tool = mcpReq["tool"]?.jsonPrimitive?.content
            val action = mcpReq["action"]?.jsonPrimitive?.content
            val target = mcpReq["target"]?.jsonPrimitive?.content
            val owner = mcpReq["owner"]?.jsonPrimitive?.content
            val repoName = mcpReq["repo"]?.jsonPrimitive?.content
            if (tool == "github" && action == "list" && target != null) {
                val (count, items) = tryFetchGithub(target, owner, repoName)
                outText = buildString {
                    append("count: ")
                    append(count)
                    append('\n')
                    items.forEach { append("- ").append(it).append('\n') }
                }
                outParams = outParams.copy(
                    metadata = (outParams.metadata ?: emptyMap()) + mapOf("source" to "github"),
                    structured = null
                )
            }
        }
        return outText to outParams
    }

    private suspend fun tryFetchGithub(target: String, owner: String?, repo: String?): Pair<Int, List<String>> {
        val mcpCommandConfigured = kotlin.runCatching { ru.exegguto.aiadvent.BuildKonfig.MCP_GITHUB_COMMAND }
            .getOrNull().orEmpty().isNotBlank()
        if (mcpCommandConfigured) {
            try {
                val client = GitHubMcpClient()
                return when (target) {
                    "repos" -> client.listRepos()
                    "issues" -> client.listIssues(requireNotNull(owner), requireNotNull(repo))
                    "pulls" -> client.listPulls(requireNotNull(owner), requireNotNull(repo))
                    else -> 0 to emptyList()
                }
            } catch (_: Throwable) {
                // fall back below
            }
        }
        return when (target) {
            "repos" -> GitHubService.listRepos()
            "issues" -> GitHubService.listIssues(requireNotNull(owner), requireNotNull(repo))
            "pulls" -> GitHubService.listPulls(requireNotNull(owner), requireNotNull(repo))
            else -> 0 to emptyList()
        }
    }
} 