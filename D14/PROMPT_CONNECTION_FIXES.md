# Исправления подключения промптов к диалогу

## Проблема, которая была исправлена:

### Промпты не подключались к диалогу
**Проблема:** Кастомные системные промпты, настроенные для каждого проекта, не применялись в диалоге с AI.

**Причина:** Функция `loadCustomPrompt` возвращала `null` для проектов без сохраненного промпта, и этот `null` передавался в API вместо `undefined`.

## Решение:

### 1. **Исправление передачи промпта в API**
Исправлена функция `sendMessage` для правильной передачи кастомного промпта:
```javascript
// Get custom system prompt for the current project
const customPrompt = loadCustomPrompt(currentProjectId);
console.log('Using custom prompt for project:', currentProjectId, customPrompt ? 'YES' : 'NO');

const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        message,
        sessionId: currentSessionId,
        projectId: currentProjectId,
        shouldExecute,
        model,
        systemPrompt: customPrompt || undefined, // Исправлено: null -> undefined
    }),
});
```

### 2. **Добавление логирования для отладки**
Добавлено логирование в ключевых местах для отслеживания передачи промптов:

#### В `llmService.processMessage`:
```typescript
logger.info('System prompt configuration', {
    hasCustomPrompt: !!customSystemPrompt,
    customPromptLength: customSystemPrompt?.length || 0,
    finalPromptLength: systemPrompt.length,
});
```

#### В `chatService.processMessage`:
```typescript
logger.info('Processing chat message', {
    sessionId,
    projectId,
    messageLength: userMessage.length,
    shouldExecute,
    hasCustomSystemPrompt: !!systemPrompt,
    customPromptLength: systemPrompt?.length || 0,
});
```

#### В `sendMessage`:
```javascript
console.log('Using custom prompt for project:', currentProjectId, customPrompt ? 'YES' : 'NO');
```

### 3. **Перемещение кнопки промпта в левую панель**
Кнопка настройки промпта перенесена из заголовка чата в каждый проект в левой панели:

```javascript
<div class="project-actions">
    <button class="project-action-btn prompt-btn" onclick="event.stopPropagation(); showPromptModal('${project.id}')" title="Edit System Prompt">
        ⚙️ Prompt
    </button>
    <button class="project-action-btn" onclick="event.stopPropagation(); clearProjectHistory('${project.id}')">
        Clear History
    </button>
    <button class="project-action-btn danger" onclick="event.stopPropagation(); deleteProject('${project.id}')">
        Delete
    </button>
</div>
```

### 4. **Улучшение модального окна промпта**
Модальное окно теперь показывает название проекта в заголовке:
```javascript
function showPromptModal(projectId = null) {
    const modal = document.getElementById('promptModal');
    const textarea = document.getElementById('systemPrompt');
    const title = document.getElementById('promptModalTitle');
    
    // Use provided projectId or currentProjectId
    const targetProjectId = projectId || currentProjectId;
    
    // Update modal title
    if (targetProjectId) {
        // Try to get project name
        const projectElement = document.querySelector(`[data-project-id="${targetProjectId}"]`);
        const projectName = projectElement ? projectElement.querySelector('.project-name').textContent : 'Project';
        title.textContent = `Edit System Prompt - ${projectName}`;
    } else {
        title.textContent = 'Edit System Prompt - Global';
    }
    
    // ... rest of the function
}
```

## Цепочка передачи промпта:

1. **Frontend**: `sendMessage()` → `loadCustomPrompt(projectId)` → `localStorage.getItem(promptKey)`
2. **API**: `/api/chat` → `chatMessageSchema.parse()` → `systemPrompt: z.string().optional()`
3. **ChatService**: `processMessage()` → `llmService.processMessage(..., systemPrompt)`
4. **LLMService**: `processMessage()` → `customSystemPrompt || buildSystemPrompt()`
5. **OpenAI**: `openai.chat.completions.create()` → `messages` с кастомным системным промптом

## Тестирование:

### Запуск тестов:
```bash
node test-prompt-connection.js
```

### Проверка в браузере:
1. Откройте http://localhost:3010 в браузере
2. Создайте несколько проектов
3. Для каждого проекта нажмите синюю кнопку "⚙️ Prompt" в левой панели
4. Настройте разные промпты для каждого проекта
5. Отправьте одинаковые сообщения в разных проектах
6. Проверьте, что AI отвечает по-разному в зависимости от промпта

### Проверка логов:
1. В консоли браузера должны быть сообщения: "Using custom prompt for project: ..."
2. В логах сервера должны быть сообщения: "System prompt configuration"
3. В логах сервера должны быть сообщения: "Processing chat message" с информацией о промпте

## Файлы, которые были изменены:

- `D14/public/index.html` - Исправлена функция `sendMessage`, добавлена кнопка промпта в проекты
- `D14/src/services/llm.service.ts` - Добавлено логирование конфигурации промпта
- `D14/src/services/chat.service.ts` - Добавлено логирование передачи промпта
- `D14/test-prompt-connection.js` - Тестовый скрипт для проверки подключения промптов

## Результат:

- ✅ Кастомные промпты правильно передаются в диалог
- ✅ Каждый проект имеет свою кнопку настройки промпта
- ✅ Модальное окно показывает название проекта
- ✅ Логирование помогает отслеживать передачу промптов
- ✅ Разные промпты производят разные стили ответов AI
- ✅ Дефолтный промпт используется, когда кастомный не настроен
