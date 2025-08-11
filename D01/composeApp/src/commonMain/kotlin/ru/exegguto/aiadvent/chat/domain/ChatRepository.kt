package ru.exegguto.aiadvent.chat.domain

import ru.exegguto.aiadvent.chat.data.Chat
import ru.exegguto.aiadvent.chat.data.ChatSummary
import ru.exegguto.aiadvent.chat.data.Message
import ru.exegguto.aiadvent.chat.data.AssistantMessageParams

interface ChatRepository {
    suspend fun listChats(): List<ChatSummary>
    suspend fun getChat(chatId: String): Chat?
    suspend fun createChat(initialTitle: String, modelId: String): Chat
    suspend fun appendMessage(chatId: String, message: Message): Chat
    suspend fun updateMessageContent(chatId: String, messageId: String, newContent: String): Chat
    suspend fun updateMessageParams(chatId: String, messageId: String, params: AssistantMessageParams): Chat
    suspend fun deleteChat(chatId: String)
} 