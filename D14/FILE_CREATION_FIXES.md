# Исправления создания файлов и прокрутки

## Проблемы, которые были исправлены:

### 1. **Файлы не создавались при генерации кода LLM**
**Проблема:** LLM генерировал код, но файлы не сохранялись в проекте.

**Причина:** LLM не указывал имена файлов в формате ````language:filename`, поэтому система пропускала сохранение.

### 2. **Нет прокрутки в списке диалогов**
**Проблема:** Список проектов в левой панели не прокручивался при большом количестве проектов.

**Причина:** Контейнер `.sidebar` не имел фиксированной высоты и правильных CSS свойств для прокрутки.

## Решение:

### 1. **Улучшение системного промпта**
Добавлены четкие инструкции для LLM о формате кода:
```typescript
ФОРМАТ КОДА:
\`\`\`language:filename
код_здесь
\`\`\`

ВАЖНО: Всегда указывай имя файла в формате \`\`\`language:filename
Примеры:
- \`\`\`python:main.py
- \`\`\`python:test_main.py
- \`\`\`javascript:app.js
- \`\`\`javascript:test_app.js
```

### 2. **Автоматическая генерация имен файлов**
Добавлена функция `generateFilename` для создания имен файлов, если LLM их не указал:
```typescript
private generateFilename(language: string, index: number, code: string): string {
  const languageMap: { [key: string]: string } = {
    'python': 'py',
    'javascript': 'js',
    'typescript': 'ts',
    'java': 'java',
    'go': 'go',
    'rust': 'rs',
    // ... другие языки
  };
  
  const extension = languageMap[language.toLowerCase()] || 'txt';
  
  // Определение типа файла по содержимому
  const isTest = code.toLowerCase().includes('test') || 
                 code.toLowerCase().includes('unittest') || 
                 code.toLowerCase().includes('pytest');
  
  if (isTest) {
    return `test_${index + 1}.${extension}`;
  }
  
  const isMain = code.toLowerCase().includes('if __name__') ||
                 code.toLowerCase().includes('main()') ||
                 code.toLowerCase().includes('console.log');
  
  if (isMain) {
    return `main.${extension}`;
  }
  
  return `file_${index + 1}.${extension}`;
}
```

### 3. **Улучшение извлечения блоков кода**
Обновлена функция `extractCodeBlocks` для автоматической генерации имен:
```typescript
private extractCodeBlocks(content: string): CodeBlock[] {
  const codeBlockRegex = /```(\w+)(?::([^\n]+))?\n([\s\S]*?)```/g;
  const blocks: CodeBlock[] = [];
  let match;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'text';
    let filename = match[2] || undefined;
    const code = match[3]?.trim() || '';
    
    // Генерируем имя файла, если не указано
    if (!filename) {
      filename = this.generateFilename(language, blockIndex, code);
    }
    
    blocks.push({
      language,
      filename,
      code,
    });
    
    blockIndex++;
  }

  return blocks;
}
```

### 4. **Исправление CSS для прокрутки**
Добавлены CSS свойства для правильной прокрутки в сайдбаре:
```css
.sidebar {
    width: 300px;
    height: 100vh;           /* Фиксированная высота */
    background: #161b22;
    border-right: 1px solid #30363d;
    display: flex;
    flex-direction: column;
    overflow: hidden;        /* Скрываем переполнение */
}

.projects-list {
    flex: 1;
    overflow-y: auto;        /* Вертикальная прокрутка */
    padding: 10px 0;
    min-height: 0;           /* Важно для flex-контейнеров */
}
```

### 5. **Добавление логирования**
Добавлено подробное логирование для отслеживания создания файлов:
```typescript
logger.info('Saving generated files to project', {
  projectId,
  codeBlocksCount: llmResponse.codeBlocks.length,
  codeBlocks: llmResponse.codeBlocks.map(block => ({
    filename: block.filename,
    language: block.language,
    codeLength: block.code.length
  }))
});

logger.info('File saved successfully', {
  projectId,
  filename: block.filename,
  fileType
});
```

## Тестирование:

### Запуск тестов:
```bash
node test-file-creation.js
```

### Проверка в браузере:
1. Откройте http://localhost:3010 в браузере
2. Создайте несколько проектов (больше 5-6)
3. Проверьте, что список проектов прокручивается
4. Отправьте сообщение, которое генерирует код
5. Проверьте, что файлы появляются в дереве файлов
6. Кликните на файлы для просмотра содержимого

### Проверка логов:
1. В логах сервера должны быть сообщения: "Saving generated files to project"
2. Должны быть сообщения: "File saved successfully"
3. Если файлы не создаются, проверьте сообщения об ошибках

## Файлы, которые были изменены:

- `D14/src/services/llm.service.ts` - Улучшен системный промпт, добавлена генерация имен файлов
- `D14/public/index.html` - Исправлены CSS стили для прокрутки
- `D14/src/services/chat.service.ts` - Добавлено логирование создания файлов
- `D14/test-file-creation.js` - Тестовый скрипт для проверки создания файлов

## Результат:

- ✅ Файлы создаются при генерации кода LLM
- ✅ Автоматическая генерация имен файлов, если LLM их не указал
- ✅ Правильное определение типов файлов (code/test)
- ✅ Список проектов прокручивается при большом количестве
- ✅ Подробное логирование процесса создания файлов
- ✅ Улучшенный системный промпт с примерами формата
