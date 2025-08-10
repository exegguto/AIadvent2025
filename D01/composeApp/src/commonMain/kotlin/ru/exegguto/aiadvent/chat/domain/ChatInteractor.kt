package ru.exegguto.aiadvent.chat.domain

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

    suspend fun sendUserMessage(chatId: String, text: String, modelId: String) {
        val userMessage = Message(
            id = generateId(),
            chatId = chatId,
            role = MessageRole.USER,
            content = text,
            createdAtEpochMs = now(),
        )
        val afterUser = repository.appendMessage(chatId, userMessage)
        val (assistantText, params) = assistant.sendMessage(modelId, afterUser.messages, text)
        val assistantMessage = Message(
            id = generateId(),
            chatId = chatId,
            role = MessageRole.ASSISTANT,
            content = assistantText,
            createdAtEpochMs = now(),
            assistantParams = params,
        )
        repository.appendMessage(chatId, assistantMessage)
    }

    private fun generateId(): String = "m-" + now().toString()
    private fun now(): Long = kotlinx.datetime.Clock.System.now().toEpochMilliseconds()
} 