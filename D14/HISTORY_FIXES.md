# Исправления истории чата

## Проблемы, которые были исправлены:

### 1. Ответы ассистента не сохранялись в историю
**Проблема:** Сообщения ассистента оставались как "Processing..." при повторном открытии диалога.

**Решение:** Исправлена функция `replaceMessage` для правильного сохранения полного ответа ассистента в историю:
```javascript
// Save the complete message to history
if (currentProjectId) {
    addMessageToHistory(currentProjectId, {
        role,
        content: fullContent,
        timestamp: new Date().toISOString()
    });
}
```

### 2. Код не отображался в сообщениях
**Проблема:** Код, который присылает LLM, не отображался в сообщениях.

**Решение:** Исправлена функция `replaceMessage` для правильного форматирования кода:
```javascript
// Add code blocks
if (codeBlocks && codeBlocks.length > 0) {
    fullContent += '\n\n';
    codeBlocks.forEach(block => {
        fullContent += `\n\`\`\`${block.language}${block.filename ? ':' + block.filename : ''}\n${block.code}\n\`\`\`\n`;
    });
}
```

### 3. Дерево файлов не обновлялось сразу
**Проблема:** После генерации кода дерево файлов не обновлялось автоматически.

**Решение:** Добавлено автоматическое обновление дерева файлов:
```javascript
// Update project files if new files were generated
if (codeBlocks && codeBlocks.length > 0) {
    setTimeout(() => {
        loadProjects(); // Refresh the file tree
    }, 500);
}
```

### 4. Дублирование сообщений в истории
**Проблема:** Сообщения "Processing..." не заменялись, а добавлялись новые.

**Решение:** Исправлена функция `addMessageToHistory` для замены загрузочных сообщений:
```javascript
// Check if this is a replacement for a loading message
const history = chatHistory.get(projectId);
const lastMessage = history[history.length - 1];

// If the last message is a loading message, replace it
if (lastMessage && lastMessage.content && lastMessage.content.includes('Processing...')) {
    history[history.length - 1] = message;
} else {
    history.push(message);
}
```

## JavaScript изменения:

### Функция `replaceMessage`:
- Правильное сохранение полного ответа ассистента
- Форматирование кода с markdown разметкой
- Автоматическое обновление дерева файлов

### Функция `addMessageToHistory`:
- Замена загрузочных сообщений вместо дублирования
- Правильное сохранение в localStorage

### Функция `sendMessage`:
- Дополнительное обновление дерева файлов после ответа

## Тестирование:

1. Откройте http://localhost:3010 в браузере
2. Выберите проект
3. Отправьте сообщение, которое генерирует код
4. Проверьте, что:
   - Код отображается в сообщении с правильным форматированием
   - Дерево файлов обновляется сразу после генерации
   - При переключении проектов история сохраняется
   - Нет сообщений "Processing..." в истории

## Файлы, которые были изменены:

- `D14/public/index.html` - JavaScript функции для работы с историей
- `D14/test-history-fixes.js` - тестовый скрипт для проверки исправлений

## Результат:

- ✅ Ответы ассистента сохраняются в истории
- ✅ Код отображается с правильным форматированием
- ✅ Дерево файлов обновляется автоматически
- ✅ Нет дублирования сообщений
- ✅ История сохраняется между сессиями
