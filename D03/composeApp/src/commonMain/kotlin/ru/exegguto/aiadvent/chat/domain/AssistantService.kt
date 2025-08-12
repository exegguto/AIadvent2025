package ru.exegguto.aiadvent.chat.domain

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import ru.exegguto.aiadvent.chat.data.AssistantMessageParams
import ru.exegguto.aiadvent.chat.data.Message

sealed class AssistantStreamEvent {
    data class Delta(val textDelta: String) : AssistantStreamEvent()
    data class Completed(
        val fullText: String,
        val params: AssistantMessageParams
    ) : AssistantStreamEvent()
}

interface AssistantService {
    suspend fun sendMessage(
        modelId: String,
        messages: List<Message>,
        userInput: String,
    ): Pair<String, AssistantMessageParams>

    fun streamMessage(
        modelId: String,
        messages: List<Message>,
        userInput: String,
    ): Flow<AssistantStreamEvent> = flow {
        val (text, params) = sendMessage(modelId, messages, userInput)
        emit(AssistantStreamEvent.Delta(text))
        emit(AssistantStreamEvent.Completed(text, params))
    }
}

class DipseekAssistantService : AssistantService {
    override suspend fun sendMessage(
        modelId: String,
        messages: List<Message>,
        userInput: String,
    ): Pair<String, AssistantMessageParams> {
        val content = "Дипсик: ${'$'}userInput"
        val params = AssistantMessageParams(
            modelId = modelId,
            providerId = "dipseek",
            temperature = 0.7,
            topP = 0.95,
        )
        return content to params
    }
} 