package ru.exegguto.aiadvent.chat.domain

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import ru.exegguto.aiadvent.chat.data.AssistantMessageParams
import ru.exegguto.aiadvent.chat.data.Message
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull
import ru.exegguto.aiadvent.chat.data.MessageRole

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
		val content = "Дипсик: $userInput"
		val params = AssistantMessageParams(
			modelId = modelId,
			providerId = "dipseek",
			temperature = 0.7,
			topP = 0.95,
		)
		return content to params
	}
}

/**
 * Агент 1: системный аналитик.
 * Собирает входные данные с пользователем и формирует итог в JSON {result:text}.
 */
class RequirementsAgentService(
	private val delegate: AssistantService = OpenAiAssistantService(apiKeyOverride = null)
) : AssistantService {
	override suspend fun sendMessage(
		modelId: String,
		messages: List<Message>,
		userInput: String,
	): Pair<String, AssistantMessageParams> {
		val systemPrompt = "Ты — ведущий системный аналитик. Твоя задача — на основе диалога собрать входные данные и выдать итоговый документ ТЗ. Пошагово задавай мне уточняющие вопросы, пока не получишь ВСЮ необходимую информацию. Когда когда ты посчитаешь, что данных достаточно, остановись и выдай итоговый результат в кратком описании в валидном json формате {result:text}, потом передай  result данные во второй агент. Задавай не более одного вопроса за раз."
		val withSystem = buildList {
			add(
				Message(
					id = "sys-1",
					chatId = "agent1",
					role = MessageRole.SYSTEM,
					content = systemPrompt,
					createdAtEpochMs = 0L
				)
			)
			addAll(messages)
		}
		val (text, params) = delegate.sendMessage(modelId, withSystem, userInput)
		val tagged = params.copy(
			metadata = (params.metadata ?: emptyMap()) + mapOf("agent" to "Агент 1")
		)
		return text to tagged
	}
}

/**
 * Агент 2: ревьюер достаточности.
 * Получает JSON {result:text} от Агент 1 и выдает заключение тоже в JSON.
 */
class ReviewAgentService(
	private val delegate: AssistantService = OpenAiAssistantService(apiKeyOverride = null)
) : AssistantService {
	override suspend fun sendMessage(
		modelId: String,
		messages: List<Message>,
		userInput: String,
	): Pair<String, AssistantMessageParams> {
		val systemPrompt = "Ты — ревьюер требований. Тебе передали результат первого агента. Проверь достаточность данных для начала работ и выдай краткое заключение в формате валидного JSON {result:text}. В ответе только текст."
		val withSystem = buildList {
			add(
				Message(
					id = "sys-2",
					chatId = "agent2",
					role = MessageRole.SYSTEM,
					content = systemPrompt,
					createdAtEpochMs = 0L
				)
			)
			// только промт и вход от первого агента как новый USER
			add(
				Message(
					id = "u-2",
					chatId = "agent2",
					role = MessageRole.USER,
					content = userInput,
					createdAtEpochMs = 0L
				)
			)
		}
		val (text, params) = delegate.sendMessage(modelId, withSystem, userInput)
		val tagged = params.copy(
			metadata = (params.metadata ?: emptyMap()) + mapOf("agent" to "Агент 2")
		)
		return text to tagged
	}
}

/**
 * Компоновка: поток из двух агентов.
 * 1) Агент 1 собирает и выдаёт JSON.
 * 2) Агент 2 проверяет и выдаёт заключение. Мы также отображаем, что конкретно передается второму агенту.
 */
class TwoAgentAssistantService(
	private val agent1: AssistantService = RequirementsAgentService(),
	private val agent2: AssistantService = ReviewAgentService(),
) : AssistantService {
	override suspend fun sendMessage(
		modelId: String,
		messages: List<Message>,
		userInput: String,
	): Pair<String, AssistantMessageParams> {
		// Шаг 1: Агент 1 — может задать вопрос или вернуть финальный JSON {result: text}
		val (agent1Text, agent1Params) = agent1.sendMessage(modelId, messages, userInput)

		// Пытаемся распарсить результат как JSON и извлечь ключ result
		val parsed: JsonObject? = extractResultJson(agent1Text)
		val resultText: String? = parsed?.get("result")?.jsonPrimitive?.contentOrNull

		// Если JSON с result не получен — просто возвращаем текст от первого агента без запуска второго
		if (resultText.isNullOrBlank()) {
			val tagged = agent1Params.copy(
				metadata = (agent1Params.metadata ?: emptyMap()) + mapOf("agent" to "Агент 1")
			)
			return agent1Text to tagged
		}

		// Есть финальный результат первого агента — передаем его во второй
		val forwardedPayload = parsed.toString()

		val (agent2Text, agent2Params) = agent2.sendMessage(
			modelId = modelId,
			messages = emptyList(),
			userInput = forwardedPayload
		)

		val combined = "Передано во второй агент (JSON):\n" + forwardedPayload + "\n\nЗаключение второго агента (JSON):\n" + agent2Text
		val finalParams = agent2Params.copy(
			metadata = (agent2Params.metadata ?: emptyMap()) + mapOf(
				"forwarded_to_agent2" to "true",
				"forwarded_payload" to forwardedPayload,
				"agent2_conclusion" to agent2Text,
				"agent1_provider" to agent1Params.providerId,
				"agent2_provider" to agent2Params.providerId,
				"agent" to "Агент 2"
			)
		)
		return combined to finalParams
	}

	private fun extractResultJson(text: String): JsonObject? {
		fun parseCandidate(candidate: String?): JsonObject? {
			if (candidate.isNullOrBlank()) return null
			return try {
				val obj = Json.parseToJsonElement(candidate).jsonObject
				if (obj.containsKey("result")) obj else null
			} catch (_: Throwable) { null }
		}
		val trimmed = text.trim()
		// 1) как есть
		parseCandidate(trimmed)?.let { return it }
		// 2) внутри тройных кавычек ``` ... ```
		val fenceStart = trimmed.indexOf("```")
		val fenceEnd = trimmed.lastIndexOf("```")
		if (fenceStart >= 0 && fenceEnd > fenceStart) {
			var inner = trimmed.substring(fenceStart + 3, fenceEnd).trim()
			if (inner.startsWith("json", ignoreCase = true)) {
				inner = inner.removePrefix("json").trim()
			}
			parseCandidate(inner)?.let { return it }
		}
		// 3) по фигурным скобкам
		val braceStart = trimmed.indexOf('{')
		val braceEnd = trimmed.lastIndexOf('}')
		if (braceStart >= 0 && braceEnd > braceStart) {
			val inner = trimmed.substring(braceStart, braceEnd + 1)
			parseCandidate(inner)?.let { return it }
		}
		return null
	}
}