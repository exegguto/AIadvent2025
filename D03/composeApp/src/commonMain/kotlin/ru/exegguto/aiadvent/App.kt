package ru.exegguto.aiadvent

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import com.russhwolf.settings.Settings
import kotlinx.serialization.json.Json
import org.jetbrains.compose.ui.tooling.preview.Preview
import ru.exegguto.aiadvent.chat.data.ChatLocalStore
import ru.exegguto.aiadvent.chat.data.ChatRepositoryLocal
import ru.exegguto.aiadvent.chat.domain.ChatInteractor
import ru.exegguto.aiadvent.chat.domain.DipseekAssistantService
import ru.exegguto.aiadvent.chat.domain.OpenAiAssistantService
import ru.exegguto.aiadvent.chat.screen.ChatScreen
import ru.exegguto.aiadvent.chat.screen.ChatViewModel

@Composable
@Preview
fun App() {
    MaterialTheme {
        val settings = remember { Settings() }
        val json = remember { Json { ignoreUnknownKeys = true; prettyPrint = false } }
        val store = remember { ChatLocalStore(settings, json) }
        val repo = remember { ChatRepositoryLocal(store) }
        val assistant = remember { OpenAiAssistantService(apiKeyOverride = null) }
        val interactor = remember { ChatInteractor(repo, assistant) }
        val vm = remember { ChatViewModel(interactor, repo) }
        ChatScreen(vm)
    }
}