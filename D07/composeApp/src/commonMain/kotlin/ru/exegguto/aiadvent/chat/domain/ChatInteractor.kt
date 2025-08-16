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

                        // 2) fetch via MCP/REST and send the result back into LLM to finalize
                        val mcpReq = structured?.get("mcp") as kotlinx.serialization.json.JsonObject
                        val target = mcpReq["target"]?.jsonPrimitive?.content
                        val owner = mcpReq["owner"]?.jsonPrimitive?.content
                        val repoName = mcpReq["repo"]?.jsonPrimitive?.content
                        // Loop over MCP requests until the model stops returning an MCP directive
                        var messagesSoFar: List<Message> = afterMark.messages
                        var nextStructured: JsonObject? = event.params.structured
                        var safetyCounter = 0
                        while (safetyCounter < 5) {
                            safetyCounter++
                            val mcpNext = (nextStructured?.get("mcp") as? JsonObject)
                            if (mcpNext == null) break

                            val nextTarget = mcpNext["target"]?.jsonPrimitive?.content
                            val nextOwner = mcpNext["owner"]?.jsonPrimitive?.content
                            val nextRepo = mcpNext["repo"]?.jsonPrimitive?.content
                            val fetch = tryFetchGithub(nextTarget ?: "", nextOwner, nextRepo)

                            val toolSummary = buildString {
                                append("count: ")
                                append(fetch.count)
                                append('\n')
                                fetch.items.forEach { append("- ").append(it).append('\n') }
                            }

                            val toolMsg = Message(
                                id = generateId(),
                                chatId = chatId,
                                role = MessageRole.SYSTEM,
                                content = "MCP GitHub result (via ${fetch.via}):\n" + toolSummary,
                                createdAtEpochMs = now(),
                            )

                            val (modelReplyText, modelReplyParams) = assistant.sendMessage(
                                modelId = modelId,
                                messages = messagesSoFar + toolMsg,
                                userInput = ""
                            )

                            val phase = if ((modelReplyParams.structured?.get("mcp") as? JsonObject) != null) "mcp-request" else "final"
                            val paramsMarked = modelReplyParams.copy(
                                metadata = (modelReplyParams.metadata ?: emptyMap()) + mapOf(
                                    "phase" to phase,
                                    "source" to "github",
                                    "via" to fetch.via
                                )
                            )

                            val appended = repository.appendMessage(
                                chatId,
                                Message(
                                    id = generateId(),
                                    chatId = chatId,
                                    role = MessageRole.ASSISTANT,
                                    content = modelReplyText,
                                    createdAtEpochMs = now(),
                                    assistantParams = paramsMarked
                                )
                            )
                            emit(appended)

                            messagesSoFar = appended.messages
                            nextStructured = modelReplyParams.structured
                            if (phase == "final") break
                        }
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

    private data class GithubFetchResult(val count: Int, val items: List<String>, val via: String)

    private suspend fun tryFetchGithub(target: String, owner: String?, repo: String?): GithubFetchResult {
        val mcpCommandConfigured = kotlin.runCatching { ru.exegguto.aiadvent.BuildKonfig.MCP_GITHUB_COMMAND }
            .getOrNull().orEmpty().isNotBlank()
        if (mcpCommandConfigured) {
            try {
                val client = GitHubMcpClient()
                val (c, items) = when (target) {
                    "repos" -> client.listRepos()
                    "issues" -> client.listIssues(requireNotNull(owner), requireNotNull(repo))
                    "pulls" -> client.listPulls(requireNotNull(owner), requireNotNull(repo))
                    else -> 0 to emptyList()
                }
                return GithubFetchResult(c, items, via = "githubmcpclient")
            } catch (_: Throwable) {
                // fall back below
            }
        }
        val (c2, items2) = when (target) {
            "repos" -> GitHubService.listRepos()
            "issues" -> GitHubService.listIssues(requireNotNull(owner), requireNotNull(repo))
            "pulls" -> GitHubService.listPulls(requireNotNull(owner), requireNotNull(repo))
            else -> 0 to emptyList()
        }
        return GithubFetchResult(c2, items2, via = "githubservice")
    }
} 