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
import ru.exegguto.aiadvent.chat.domain.TwoAgentAssistantService
import ru.exegguto.aiadvent.chat.screen.ChatScreen
import ru.exegguto.aiadvent.chat.screen.ChatViewModel
import ru.exegguto.aiadvent.schedule.screen.ScheduleScreen

@Composable
@Preview
fun App() {
    MaterialTheme {
        ScheduleScreen()
    }
}