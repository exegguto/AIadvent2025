package ru.exegguto.aiadvent.chat.data

import com.russhwolf.settings.Settings
import ru.exegguto.aiadvent.BuildKonfig

object SecretsProvider {
    private const val KEY_OPENAI = "openai_api_key"

    fun getOpenAiApiKey(settings: Settings? = null): String? {
        val fromBuild = BuildKonfig.OPENAI_API_KEY
        if (fromBuild.isNotBlank()) return fromBuild
        return settings?.getStringOrNull(KEY_OPENAI)
    }

    fun saveOpenAiApiKey(settings: Settings, value: String) {
        settings.putString(KEY_OPENAI, value)
    }
} 