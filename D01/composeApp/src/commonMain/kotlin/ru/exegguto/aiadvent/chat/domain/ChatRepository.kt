package ru.exegguto.aiadvent.chat.domain

import ru.exegguto.aiadvent.chat.data.Chat
import ru.exegguto.aiadvent.chat.data.ChatSummary
import ru.exegguto.aiadvent.chat.data.Message

interface ChatRepository {
    suspend fun listChats(): List<ChatSummary>
    suspend fun getChat(chatId: String): Chat?
    suspend fun createChat(initialTitle: String, modelId: String): Chat
    suspend fun appendMessage(chatId: String, message: Message): Chat
    suspend fun deleteChat(chatId: String)
} 