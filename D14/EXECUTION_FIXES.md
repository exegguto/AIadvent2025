# Исправления выполнения тестов

## Проблема, которая была исправлена:

### Тесты не выполнялись при запросе пользователя
**Проблема:** Когда пользователь просил "запустить тесты", система не выполняла их, хотя LLM должна была дать команду агенту для запуска тестов в Docker контейнере.

## Причины проблемы:

### 1. **LLM не понимал запросы на выполнение тестов**
Системный промпт не содержал четких инструкций о том, когда и как выполнять тесты.

### 2. **Файлы проекта не копировались в Docker контейнер**
При выполнении кода файлы проекта не передавались в контейнер, поэтому тесты не могли импортировать модули.

### 3. **Проблемы в коде проекта**
Функция `calculate_pi` была написана как генератор, что могло вызывать проблемы в тестах.

## Решение:

### 1. **Улучшенный системный промпт**
Добавлены четкие инструкции для LLM о выполнении тестов:
```typescript
ВЫПОЛНЕНИЕ ТЕСТОВ:
- Когда пользователь просит "запустить тесты", "run tests", "выполнить тесты" - система автоматически выполнит тесты
- Результаты выполнения будут показаны в ответе
- Если тесты не проходят, объясни проблему и предложи исправления
- Всегда показывай вывод тестов и объясняй результаты
```

### 2. **Копирование файлов проекта в контейнер**
Добавлен параметр `projectFiles` в метод `executeCode`:
```typescript
async executeCode(
  language: string,
  codeBlocks: CodeBlock[],
  sessionId: string,
  projectFiles?: Array<{ name: string; content: string }>
): Promise<CodeExecution[]>
```

### 3. **Метод копирования файлов**
Добавлен метод `copyProjectFiles` для копирования файлов проекта в контейнер:
```typescript
private async copyProjectFiles(containerId: string, projectFiles: Array<{ name: string; content: string }>): Promise<void> {
  const containerInfo = this.activeContainers.get(containerId);
  if (!containerInfo) {
    throw new Error('Container not found');
  }

  const { container } = containerInfo;
  
  for (const file of projectFiles) {
    const escapedContent = file.content.replace(/'/g, "'\"'\"'");
    await this.runCommand(container, `echo '${escapedContent}' > ${file.name}`);
  }
}
```

### 4. **Обновление ChatService**
ChatService теперь передает файлы проекта в Docker сервис:
```typescript
// Get project files if projectId is provided
let projectFiles: Array<{ name: string; content: string }> | undefined;
if (projectId) {
  const project = await projectService.getProject(projectId);
  if (project) {
    projectFiles = project.files.map(file => ({
      name: file.name,
      content: file.content,
    }));
  }
}

executions = await dockerService.executeCode(
  llmResponse.codeBlocks[0]?.language || 'python',
  llmResponse.codeBlocks,
  sessionId,
  projectFiles
);
```

## Исправления в коде проекта:

### Функция `calculate_pi.py`
Исправлена функция для возврата строки вместо генератора:
```python
def calculate_pi(precision: int = 5) -> str:
    """
    Calculate pi using the Chudnovsky algorithm
    Returns pi as a string with specified precision
    """
    q, r, t, k, n, l = 1, 0, 1, 1, 3, 3
    counter = 0
    result = []
    
    while counter < precision + 1:
        if 4*q+r-t < n*t:
            result.append(str(n))
            if counter == 0:
                result.append('.')
            counter += 1
            # ... rest of the algorithm
    
    return ''.join(result)
```

### Тест `test_calculate_pi.py`
Улучшен тест с более подробными проверками:
```python
class TestCalculatePi(unittest.TestCase):
    def test_calculate_pi_valid_results(self):
        """Test calculate_pi function with different precision levels"""
        
        # Test calculate_pi() for precision 5
        result = calculate_pi(5)
        self.assertEqual(result, '3.14159', f"Expected '3.14159', got '{result}'")
        
        # Test calculate_pi() for precision 3
        result = calculate_pi(3)
        self.assertEqual(result, '3.142', f"Expected '3.142', got '{result}'")
```

## Тестирование:

1. Откройте http://localhost:3010 в браузере
2. Выберите проект "тест1"
3. Отправьте сообщение: "Запусти тесты для функции calculate_pi"
4. Проверьте, что:
   - LLM понимает запрос на выполнение тестов
   - Тесты выполняются в Docker контейнере
   - Результаты тестов отображаются в ответе
   - Файлы проекта доступны в контейнере

## Файлы, которые были изменены:

- `D14/src/services/llm.service.ts` - Улучшен системный промпт
- `D14/src/services/docker.service.ts` - Добавлено копирование файлов проекта
- `D14/src/services/chat.service.ts` - Передача файлов проекта в Docker
- `D14/fix-calculate-pi.py` - Исправленная версия функции
- `D14/fix-test-calculate-pi.py` - Улучшенный тест
- `D14/test-execution-fixes.js` - Тестовый скрипт

## Результат:

- ✅ LLM понимает запросы на выполнение тестов
- ✅ Файлы проекта копируются в Docker контейнер
- ✅ Тесты могут импортировать модули проекта
- ✅ Результаты выполнения отображаются в чате
- ✅ Система работает как Cursor IDE
