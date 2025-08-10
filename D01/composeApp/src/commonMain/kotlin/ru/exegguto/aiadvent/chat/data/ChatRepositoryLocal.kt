package ru.exegguto.aiadvent.chat.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import ru.exegguto.aiadvent.chat.domain.ChatRepository

class ChatRepositoryLocal(
    private val store: ChatLocalStore,
) : ChatRepository {
    override suspend fun listChats() = withContext(Dispatchers.Default) {
        store.loadSummaries()
    }

    override suspend fun getChat(chatId: String) = withContext(Dispatchers.Default) {
        store.loadChat(chatId)
    }

    override suspend fun createChat(initialTitle: String, modelId: String) = withContext(Dispatchers.Default) {
        val now = kotlinx.datetime.Clock.System.now().toEpochMilliseconds()
        val chat = Chat(
            id = now.toString(),
            title = initialTitle.ifBlank { "Новый чат" },
            createdAtEpochMs = now,
            modelId = modelId,
            messages = emptyList(),
        )
        store.saveChat(chat)
        chat
    }

    override suspend fun appendMessage(chatId: String, message: Message) = withContext(Dispatchers.Default) {
        val current = store.loadChat(chatId) ?: error("Chat not found")
        val updated = current.copy(messages = current.messages + message)
        store.saveChat(updated)
        updated
    }

    override suspend fun deleteChat(chatId: String) = withContext(Dispatchers.Default) {
        store.deleteChat(chatId)
    }
} 