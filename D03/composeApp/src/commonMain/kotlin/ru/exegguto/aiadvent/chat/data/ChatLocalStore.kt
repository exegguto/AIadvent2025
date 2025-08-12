package ru.exegguto.aiadvent.chat.data

import com.russhwolf.settings.Settings
import com.russhwolf.settings.get
import com.russhwolf.settings.set
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json

class ChatLocalStore(
    private val settings: Settings,
    private val json: Json,
) {
    private fun keyChats() = "chat_store.chats"
    private fun keyChat(chatId: String) = "chat_store.chat.$chatId"

    fun loadSummaries(): List<ChatSummary> {
        val serialized = settings.getStringOrNull(keyChats()) ?: return emptyList()
        return runCatching { json.decodeFromString<List<ChatSummary>>(serialized) }.getOrElse { emptyList() }
    }

    fun saveSummaries(summaries: List<ChatSummary>) {
        settings[keyChats()] = json.encodeToString(summaries)
    }

    fun loadChat(chatId: String): Chat? {
        val serialized = settings.getStringOrNull(keyChat(chatId)) ?: return null
        return runCatching { json.decodeFromString<Chat>(serialized) }.getOrNull()
    }

    fun saveChat(chat: Chat) {
        settings[keyChat(chat.id)] = json.encodeToString(chat)
        val current = loadSummaries().toMutableList()
        val summary = ChatSummary(chat.id, chat.title, chat.messages.maxOfOrNull { it.createdAtEpochMs } ?: chat.createdAtEpochMs)
        val idx = current.indexOfFirst { it.id == chat.id }
        if (idx >= 0) current[idx] = summary else current.add(0, summary)
        saveSummaries(current.sortedByDescending { it.lastUpdatedEpochMs })
    }

    fun deleteChat(chatId: String) {
        settings.remove(keyChat(chatId))
        val updated = loadSummaries().filterNot { it.id == chatId }
        saveSummaries(updated)
    }
} 