package ru.exegguto.aiadvent.chat.domain

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.collect
import ru.exegguto.aiadvent.chat.data.Chat
import ru.exegguto.aiadvent.chat.data.Message
import ru.exegguto.aiadvent.chat.data.MessageRole

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
                    finalText = event.fullText
                    var updated = repository.updateMessageContent(chatId, assistantMessageId, finalText)
                    updated = repository.updateMessageParams(chatId, assistantMessageId, event.params)
                    emit(updated)
                }
            }
        }
    }

    suspend fun sendUserMessage(chatId: String, text: String, modelId: String) {
        sendUserMessageStream(chatId, text, modelId).collect { _ -> }
    }

    private fun generateId(): String = "m-" + now().toString()
    private fun now(): Long = kotlinx.datetime.Clock.System.now().toEpochMilliseconds()
} 