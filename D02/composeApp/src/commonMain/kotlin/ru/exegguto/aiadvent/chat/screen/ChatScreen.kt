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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import ru.exegguto.aiadvent.chat.data.Message
import ru.exegguto.aiadvent.chat.data.MessageRole
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

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
                Text(
                    text = message.content,
                    color = MaterialTheme.colorScheme.onSurface
                )
                val p = message.assistantParams
                if (p != null) {
                    val info = buildString {
                        append(p.modelId)
                        val inT = p.usagePromptTokens
                        val outT = p.usageCompletionTokens
                        val ttl = p.usageTotalTokens
                        val parts = mutableListOf<String>()
                        if (inT != null) parts.add("input $inT")
                        if (outT != null) parts.add("output $outT")
                        if (ttl != null) parts.add("total $ttl")
                        if (parts.isNotEmpty()) {
                            append("  •  ")
                            append(parts.joinToString(", "))
                        }
                    }
                    Text(
                        text = info,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp)
                    )

                    // Show pretty JSON that we got from the model
                    val structured = p.structured
                    if (structured != null) {
                        val pretty = runCatching {
                            Json { prettyPrint = true }.encodeToString(structured)
                        }.getOrNull()
                        if (!pretty.isNullOrBlank()) {
                            Text(
                                text = pretty,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 8.dp)
                            )
                        }
                    }
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