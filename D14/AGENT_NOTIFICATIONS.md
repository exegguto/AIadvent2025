# Система уведомлений о выполнении команд агентом

## Обзор

Система уведомлений позволяет пользователям видеть, когда агент выполняет команды, создает файлы, запускает тесты и выполняет другие действия. Уведомления появляются в правом верхнем углу экрана и автоматически исчезают.

## Типы уведомлений

### 1. **Выполнение кода**
- **🤖 Агент выполняет команду: [команда]** - когда агент начинает выполнение команды
- **🐳 Docker контейнер запущен** - когда агент начинает выполнение кода
- **⚡ Выполняется код...** - когда код выполняется в контейнере
- **📤 Вывод выполнения: [предварительный просмотр]** - когда получен результат выполнения
- **✅ Docker выполнение завершено (XXXms)** - когда выполнение кода завершено успешно
- **❌ Ошибка выполнения** - когда выполнение кода завершилось с ошибкой

### 2. **Тестирование**
- **🧪 Агент запускает тесты...** - когда агент начинает выполнение тестов
- **🧪 Выполняются тесты...** - когда тесты выполняются в контейнере
- **✅ Тесты выполнены успешно** - когда все тесты прошли успешно
- **❌ Тесты не прошли** - когда тесты завершились с ошибками
- **📊 Результаты тестов: ✅ X/Y тестов прошли** - детальные результаты тестов

### 3. **Работа с файлами**
- **📁 Файл создан агентом** - когда агент создает новый файл
- **📝 Файл обновлен агентом** - когда агент изменяет существующий файл

### 4. **Общие команды**
- **🤖 Агент выполняет команду: [команда]** - для общих команд агента
- **❌ Ошибка сети** - при проблемах с сетевым соединением

## Последовательность уведомлений

### Для выполнения кода:
1. **🤖 Агент выполняет команду: [команда]**
2. **🐳 Docker контейнер запущен**
3. **⚡ Выполняется код...**
4. **📤 Вывод выполнения: [предварительный просмотр]**
5. **✅ Docker выполнение завершено (XXXms)**

### Для выполнения тестов:
1. **🤖 Агент выполняет команду: [команда]**
2. **🧪 Агент запускает тесты...**
3. **🐳 Docker контейнер запущен**
4. **🧪 Выполняются тесты...**
5. **✅ Тесты выполнены успешно** (или **❌ Тесты не прошли**)
6. **📊 Результаты тестов: ✅ X/Y тестов прошли**

## Как это работает

### Frontend (JavaScript)

#### Система уведомлений
```javascript
// Показать уведомление
showNotification(message, type, duration);

// Типы уведомлений:
// - 'info' (синий) - информационные сообщения
// - 'success' (зеленый) - успешные операции
// - 'warning' (желтый) - предупреждения
// - 'error' (красный) - ошибки
```

#### Отслеживание выполнения команд
```javascript
// Отслеживание выполнения команд агентом
trackAgentExecution(command, status, details);

// Статусы:
// - 'started' - команда начата
// - 'completed' - команда завершена
// - 'failed' - команда завершилась с ошибкой
// - 'testing' - запуск тестов
// - 'test_running' - тесты выполняются
// - 'testing_completed' - тесты завершены успешно
// - 'testing_failed' - тесты завершились с ошибкой
// - 'file_created' - файл создан
// - 'file_updated' - файл обновлен
// - 'docker_started' - Docker контейнер запущен
// - 'execution_running' - код выполняется
// - 'execution_output' - получен вывод выполнения
// - 'docker_completed' - Docker выполнение завершено
// - 'test_output' - получены результаты тестов
```

### Backend (TypeScript)

#### Логирование в ChatService
```typescript
// Логирование начала выполнения
logger.info('Agent executing code', {
  sessionId,
  projectId,
  language: llmResponse.codeBlocks[0]?.language,
  codeBlocksCount: llmResponse.codeBlocks.length,
  userMessage: userMessage.substring(0, 100) + '...'
});

// Логирование завершения выполнения
logger.info('Agent execution completed', {
  sessionId,
  projectId,
  executionsCount: executions.length,
  successCount: executions.filter(e => e.result.success).length,
  failureCount: executions.filter(e => !e.result.success).length
});
```

#### Логирование в DockerService
```typescript
// Логирование начала выполнения кода
logger.info('Agent starting code execution', {
  executionId,
  language: block.language,
  filename: block.filename,
  codeLength: block.code.length,
  hasProjectFiles: projectFiles && projectFiles.length > 0,
  projectFilesCount: projectFiles?.length || 0
});

// Логирование создания Docker контейнера
logger.info('Creating Docker container', {
  executionId,
  image: dockerConfig.image,
  language: dockerConfig.language
});

// Логирование успешного создания контейнера
logger.info('Docker container created successfully', {
  executionId,
  containerId,
  image: dockerConfig.image
});

// Логирование копирования файлов проекта
logger.info('Copying project files to container', {
  executionId,
  containerId,
  filesCount: projectFiles.length,
  files: projectFiles.map(f => f.name)
});

// Логирование начала выполнения кода в контейнере
logger.info('Starting code execution in container', {
  executionId,
  containerId,
  language: block.language,
  filename: block.filename || 'main',
  isTest: block.code.toLowerCase().includes('test')
});

// Логирование завершения выполнения кода
logger.info('Agent code execution completed', {
  executionId,
  success: result.success,
  duration,
  outputLength: result.output.length,
  exitCode: result.exitCode,
  hasError: !!result.error,
  isTestExecution: result.output.toLowerCase().includes('test')
});
```

## Автоматическое определение команд

Система автоматически определяет тип команды по ключевым словам:

### Тестирование
- "запусти тесты"
- "run tests"
- "выполни тесты"

### Создание файлов
- "создай файл"
- "create file"

### Редактирование файлов
- "измени файл"
- "edit file"

### Выполнение кода
- Когда включен переключатель "Execute code automatically"

## CSS стили уведомлений

```css
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #238636;
    color: #f0f6fc;
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    max-width: 400px;
    font-size: 14px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
}

.notification.show {
    transform: translateX(0);
}

.notification.error {
    background: #da3633;
}

.notification.warning {
    background: #d29922;
}

.notification.info {
    background: #1f6feb;
}

/* Индикатор прогресса выполнения */
.execution-progress {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

## Тестирование

### Запуск теста уведомлений
```bash
node test-agent-notifications.js
```

### Запуск теста процесса выполнения
```bash
node test-execution-process.js
```

### Проверка в браузере
1. Откройте http://localhost:3010
2. Выберите проект "Execution Process Test"
3. Включите переключатель "Execute code automatically"
4. Попробуйте команды:
   - "Запусти тесты для функции add_numbers"
   - "Выполни код: print('Hello from Docker')"
5. Следите за уведомлениями в правом верхнем углу

### Ожидаемые уведомления
- 🤖 Агент выполняет команду: [команда]
- 🐳 Docker контейнер запущен
- ⚡ Выполняется код... (или 🧪 Выполняются тесты...)
- 📤 Вывод выполнения: [предварительный просмотр]
- ✅ Docker выполнение завершено (XXXms)
- 📊 Результаты тестов: ✅ X/Y тестов прошли (для тестов)

## Логирование

Все действия агента логируются в:
- Консоль браузера (для frontend событий)
- Логи сервера (для backend операций)
- Уведомления пользователю (для важных событий)

## Настройка

### Длительность уведомлений
- Успешные операции: 5 секунд
- Информационные сообщения: 5 секунд
- Ошибки: до закрытия пользователем
- Выполнение команд: до завершения

### Позиция уведомлений
- По умолчанию: правый верхний угол
- Можно изменить в CSS: `.notification { top: 20px; right: 20px; }`

## Расширение системы

Для добавления новых типов уведомлений:

1. Добавьте новый статус в `trackAgentExecution()`
2. Добавьте соответствующее сообщение в объект `messages`
3. Добавьте логирование в backend
4. Протестируйте новое уведомление

## Результат

- ✅ Пользователи видят полный процесс выполнения команд
- ✅ Прозрачность работы системы
- ✅ Детальные уведомления о статусе выполнения
- ✅ Автоматическое определение типов команд
- ✅ Подробное логирование для отладки
- ✅ Красивый UI с анимациями
- ✅ Отображение времени выполнения
- ✅ Предварительный просмотр результатов
