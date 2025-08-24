# Исправления промптов на уровне проекта

## Проблемы, которые были исправлены:

### 1. **Глобальный промпт для всех проектов**
**Проблема:** Системный промпт был общим для всех проектов, что не позволяло настраивать поведение AI для разных типов проектов.

**Решение:** Каждый проект теперь имеет свой собственный системный промпт, сохраняемый в localStorage с ключом `cursor_system_prompt_${projectId}`.

### 2. **Дерево каталога не подгружалось**
**Проблема:** При выборе проекта дерево файлов не обновлялось автоматически, показывая старые файлы.

**Решение:** Добавлена функция `updateFileTree` для динамического обновления дерева файлов при загрузке проекта.

## Реализованные изменения:

### 1. **Промпты на уровне проекта**

#### Функция `loadCustomPrompt(projectId)`:
```javascript
function loadCustomPrompt(projectId) {
    const promptKey = projectId ? `cursor_system_prompt_${projectId}` : 'cursor_system_prompt_global';
    const customPrompt = localStorage.getItem(promptKey);
    if (customPrompt) {
        console.log('Loaded custom system prompt for project:', projectId);
        return customPrompt;
    }
    return null;
}
```

#### Функция `savePrompt()`:
```javascript
function savePrompt() {
    const textarea = document.getElementById('systemPrompt');
    const prompt = textarea.value.trim();
    
    if (prompt) {
        // Save prompt for the specific project
        const promptKey = currentProjectId ? `cursor_system_prompt_${currentProjectId}` : 'cursor_system_prompt_global';
        localStorage.setItem(promptKey, prompt);
        console.log('System prompt saved for project:', currentProjectId, prompt);
        // ...
    }
}
```

#### Функция `showPromptModal()`:
```javascript
function showPromptModal() {
    const modal = document.getElementById('promptModal');
    const textarea = document.getElementById('systemPrompt');
    
    // Load current prompt for the specific project or default
    const promptKey = currentProjectId ? `cursor_system_prompt_${currentProjectId}` : 'cursor_system_prompt_global';
    const currentPrompt = localStorage.getItem(promptKey) || DEFAULT_SYSTEM_PROMPT;
    textarea.value = currentPrompt;
    
    modal.style.display = 'flex';
}
```

### 2. **Обновление дерева файлов**

#### Функция `loadProjectDetails(projectId)`:
```javascript
async function loadProjectDetails(projectId) {
    try {
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('currentProjectName').textContent = data.data.name;
            
            // Update file tree with project files
            updateFileTree(projectId, data.data.files);
        }
    } catch (error) {
        console.error('Failed to load project details:', error);
    }
}
```

#### Функция `updateFileTree(projectId, files)`:
```javascript
function updateFileTree(projectId, files) {
    // Find the project element and update its file tree
    const projectElement = document.querySelector(`[data-project-id="${projectId}"]`);
    if (projectElement) {
        const fileTreeElement = projectElement.querySelector('.file-tree');
        if (fileTreeElement) {
            fileTreeElement.innerHTML = files.map(file => `
                <div class="file-item file-type-${file.type}" onclick="event.stopPropagation(); viewFile('${projectId}', '${file.name}')">
                    <span class="file-icon">📄</span>
                    <span class="file-name">${file.name}</span>
                    <span class="file-type-badge">${file.type}</span>
                </div>
            `).join('');
        }
    }
}
```

#### Добавление `data-project-id` атрибута:
```javascript
return `
    <div class="project-item ${isActive ? 'active' : ''}" 
         data-project-id="${project.id}"
         onclick="selectProject('${project.id}')">
    // ...
`;
```

## Примеры использования:

### Разные промпты для разных проектов:

#### Проект 1 - Python разработка:
```
Ты - AI помощник для Python разработки. Твоя задача - помогать с Python кодом.

ОСНОВНЫЕ ПРИНЦИПЫ:
1. Используй только Python
2. Всегда добавляй docstrings
3. Следуй PEP 8
4. Объясняй код подробно

КОМАНДЫ:
- "создай функцию" → создание Python функции
- "запусти тесты" → выполнение тестов (АГЕНТ ВЫПОЛНИТ)
- "покажи структуру" → отображение файлов проекта
```

#### Проект 2 - Тестирование:
```
Ты - AI помощник для тестирования. Твоя задача - создавать качественные тесты.

ОСНОВНЫЕ ПРИНЦИПЫ:
1. Создавай comprehensive тесты
2. Используй unittest или pytest
3. Тестируй edge cases
4. Добавляй комментарии к тестам

КОМАНДЫ:
- "создай тесты" → создание тестов
- "запусти тесты" → выполнение тестов (АГЕНТ ВЫПОЛНИТ)
- "проверь покрытие" → анализ покрытия кода
```

## Тестирование:

### Запуск тестов:
```bash
node test-prompt-per-project.js
```

### Проверка функций:
1. Откройте http://localhost:3010 в браузере
2. Создайте несколько проектов
3. Для каждого проекта нажмите "⚙️ Prompt" и настройте разные промпты
4. Переключайтесь между проектами и проверьте:
   - Промпты сохраняются для каждого проекта отдельно
   - Дерево файлов обновляется при выборе проекта
   - AI ведет себя по-разному в зависимости от промпта

## Файлы, которые были изменены:

- `D14/public/index.html` - JavaScript функции для работы с промптами на уровне проекта
- `D14/test-prompt-per-project.js` - Тестовый скрипт для проверки функций

## Результат:

- ✅ Каждый проект имеет свой системный промпт
- ✅ Промпты сохраняются в localStorage с уникальными ключами
- ✅ Дерево файлов обновляется при выборе проекта
- ✅ Файлы отображаются корректно для каждого проекта
- ✅ AI адаптируется к настройкам конкретного проекта
- ✅ Поддержка глобального промпта для случаев без выбранного проекта
