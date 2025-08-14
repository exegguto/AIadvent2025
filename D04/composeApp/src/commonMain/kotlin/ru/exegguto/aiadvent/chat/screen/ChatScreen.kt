package ru.exegguto.aiadvent.chat.screen

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import ru.exegguto.aiadvent.chat.data.Message
import ru.exegguto.aiadvent.chat.data.MessageRole
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonPrimitive

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(viewModel: ChatViewModel) {
    val state = viewModel.state
    val drawerState = rememberDrawerState(if (state.isDrawerOpen) DrawerValue.Open else DrawerValue.Closed)

    LaunchedEffect(state.isDrawerOpen) {
        if (state.isDrawerOpen) drawerState.open() else drawerState.close()
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Text(
                    text = "История",
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.titleMedium
                )
                Divider()
                LazyColumn(modifier = Modifier.fillMaxWidth()) {
                    items(state.chats) { item ->
                        ListItem(
                            headlineContent = { Text(item.title) },
                            supportingContent = { Text(item.lastUpdatedEpochMs.toString()) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { viewModel.openChat(item.id) }
                        )
                    }
                }
            }
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(state.currentChat?.title ?: "Чат") },
                    navigationIcon = {
                        IconButton(onClick = { viewModel.toggleDrawer() }) {
                            Icon(Icons.Filled.Menu, contentDescription = "menu")
                        }
                    },
                    actions = {
                        IconButton(onClick = { viewModel.newChat() }) {
                            Icon(Icons.Filled.Add, contentDescription = "new chat")
                        }
                    }
                )
            },
            bottomBar = {
                MessageInput(
                    value = state.inputText,
                    onValueChange = viewModel::updateInput,
                    onSend = { viewModel.sendMessage() },
                    isSending = state.isSending
                )
            }
        ) { padding ->
            Box(modifier = Modifier.padding(padding)) {
                val messages = state.currentChat?.messages.orEmpty()
                MessagesList(messages)
            }
        }
    }
}

@Composable
private fun MessagesList(messages: List<Message>) {
    val listState = rememberLazyListState()
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.lastIndex)
        }
    }
    LazyColumn(
        state = listState,
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(messages) { msg ->
            when (msg.role) {
                MessageRole.USER -> UserBubble(msg.content)
                MessageRole.ASSISTANT -> AssistantBubble(msg)
                else -> AssistantBubble(msg)
            }
        }
    }
}

@Composable
private fun UserBubble(text: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
        Surface(
            shape = MaterialTheme.shapes.medium,
            color = MaterialTheme.colorScheme.primaryContainer,
            tonalElevation = 1.dp
        ) {
            Text(
                text = text,
                modifier = Modifier
                    .widthIn(max = 360.dp)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                textAlign = TextAlign.Start,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }
    }
}

@Composable
private fun AssistantBubble(message: Message) {
    Row(Modifier.fillMaxWidth()) {
        Box(
            modifier = Modifier
                .fillMaxWidth(0.9f)
        ) {
            Column(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .animateContentSize()
            ) {
                val p = message.assistantParams
                val structured = p?.structured
                val hasStructured = structured != null

                if (hasStructured) {
                    val answerEl: JsonElement? = structured!!["answer"]
                    val answer: String? = (answerEl as? JsonPrimitive)?.content

                    val pointsEl: JsonElement? = structured["points"]
                    val points: List<String> = pointsEl?.jsonArray?.mapNotNull { el: JsonElement ->
                        (el as? JsonPrimitive)?.content
                    } ?: emptyList()

                    val summaryEl: JsonElement? = structured["summary"]
                    val summary: String? = (summaryEl as? JsonPrimitive)?.content

                    val resultEl: JsonElement? = structured["result"]
                    val result: String? = (resultEl as? JsonPrimitive)?.content

                    if (!answer.isNullOrBlank()) {
                        Text(
                            text = answer,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    if (!result.isNullOrBlank()) {
                        Text(
                            text = result,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    if (points.isNotEmpty()) {
                        Spacer(Modifier.height(4.dp))
                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            points.forEach { pt: String ->
                                Text(
                                    text = "• $pt",
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                    if (!summary.isNullOrBlank()) {
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = summary,
                            style = MaterialTheme.typography.bodySmall.copy(fontStyle = FontStyle.Italic),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    val nothingExtracted = answer.isNullOrBlank() && result.isNullOrBlank() && points.isEmpty() && summary.isNullOrBlank()
                    if (nothingExtracted && message.content.isNotBlank()) {
                        Text(
                            text = message.content,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                } else {
                    Text(
                        text = message.content,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                val info = p?.let {
                    buildString {
                        val agent = it.metadata?.get("agent")
                        if (!agent.isNullOrBlank()) {
                            append(agent)
                            append(": ")
                        }
                        append(it.modelId)
                        val inT = it.usagePromptTokens
                        val outT = it.usageCompletionTokens
                        val ttl = it.usageTotalTokens
                        val parts = mutableListOf<String>()
                        if (inT != null) parts.add("input $inT")
                        if (outT != null) parts.add("output $outT")
                        if (ttl != null) parts.add("total $ttl")
                        if (parts.isNotEmpty()) {
                            append("  •  ")
                            append(parts.joinToString(", "))
                        }
                    }
                }
                if (!info.isNullOrBlank()) {
                    Text(
                        text = info,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }

                val fwd = p?.metadata?.get("forwarded_payload")
                if (!fwd.isNullOrBlank()) {
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = "Передано во второй агент:\n$fwd",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                val conclusion = p?.metadata?.get("agent2_conclusion")
                if (!conclusion.isNullOrBlank()) {
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = "Заключение второго агента (JSON):\n$conclusion",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun MessageInput(
    value: String,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit,
    isSending: Boolean
) {
    Surface(shadowElevation = 2.dp) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .imePadding()
                .navigationBarsPadding()
                .padding(8.dp),
            verticalAlignment = Alignment.Bottom
        ) {
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier
                    .weight(1f),
                maxLines = 6,
                placeholder = { Text("Сообщение…") }
            )
            Spacer(Modifier.width(8.dp))
            FilledIconButton(onClick = onSend, enabled = !isSending && value.isNotBlank()) {
                Icon(Icons.Filled.Send, contentDescription = "send")
            }
        }
    }
} 