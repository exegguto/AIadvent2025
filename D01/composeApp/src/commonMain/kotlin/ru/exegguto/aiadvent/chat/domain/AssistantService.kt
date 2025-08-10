package ru.exegguto.aiadvent.chat.domain

import ru.exegguto.aiadvent.chat.data.AssistantMessageParams
import ru.exegguto.aiadvent.chat.data.Message
import ru.exegguto.aiadvent.chat.data.MessageRole

interface AssistantService {
    suspend fun sendMessage(
        modelId: String,
        messages: List<Message>,
        userInput: String,
    ): Pair<String, AssistantMessageParams>
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