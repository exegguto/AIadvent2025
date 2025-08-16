package ru.exegguto.aiadvent.chat.screen

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import ru.exegguto.aiadvent.chat.data.Chat
import ru.exegguto.aiadvent.chat.data.ChatSummary
import ru.exegguto.aiadvent.chat.data.Message
import ru.exegguto.aiadvent.chat.data.MessageRole
import ru.exegguto.aiadvent.chat.domain.ChatInteractor
import ru.exegguto.aiadvent.chat.domain.ChatRepository

@Immutable
data class ChatUiState(
    val chats: List<ChatSummary> = emptyList(),
    val currentChat: Chat? = null,
    val isDrawerOpen: Boolean = false,
    val inputText: String = "Какой язык чаще всего используется в моем Github",
    val isSending: Boolean = false,
    val currentModelId: String = "gpt-4o-mini",
)

class ChatViewModel(
    private val interactor: ChatInteractor,
    private val repository: ChatRepository,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.Main + Job()),
) {
    var state by mutableStateOf(ChatUiState())
        private set

    init {
        refreshChats()
        scope.launch {
            // auto-create first chat
            if (state.chats.isEmpty()) {
                val id = interactor.newChat(state.currentModelId)
                openChat(id)
            }
        }
    }

    fun refreshChats() {
        scope.launch {
            val list = repository.listChats()
            state = state.copy(chats = list)
        }
    }

    fun openChat(chatId: String) {
        scope.launch {
            val chat = repository.getChat(chatId)
            state = state.copy(currentChat = chat, isDrawerOpen = false)
        }
    }

    fun newChat() {
        scope.launch {
            val id = interactor.newChat(state.currentModelId)
            refreshChats()
            openChat(id)
        }
    }

    fun updateInput(text: String) {
        state = state.copy(inputText = text)
    }

    fun toggleDrawer(open: Boolean? = null) {
        val target = open ?: !state.isDrawerOpen
        state = state.copy(isDrawerOpen = target)
    }

    fun sendMessage() {
        val chatId = state.currentChat?.id ?: return
        val text = state.inputText.trim()
        if (text.isBlank() || state.isSending) return
        state = state.copy(isSending = true, inputText = "")
        scope.launch {
            try {
                interactor.sendUserMessageStream(chatId, text, state.currentModelId).collect { updatedChat ->
                    state = state.copy(currentChat = updatedChat)
                }
                refreshChats()
            } finally {
                state = state.copy(isSending = false)
            }
        }
    }
} 