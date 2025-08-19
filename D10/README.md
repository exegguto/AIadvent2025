# 🤖 AI Code Executor

AI агент для безопасного выполнения кода в Docker контейнерах. Поддерживает множество языков программирования и предоставляет REST API для интеграции.

## 🚀 Возможности

- **Безопасное выполнение кода** в изолированных Docker контейнерах
- **Поддержка множества языков**: Python, JavaScript, Bash, Java, Go, Rust
- **REST API** для интеграции с другими системами
- **Веб-интерфейс** для удобного тестирования
- **Мониторинг и статистика** выполнения
- **Автоматическая очистка** контейнеров
- **Защита от опасных команд**

## 📋 Требования

- Docker
- Node.js 18+
- npm или yarn

## 🛠️ Установка

1. **Клонируйте репозиторий:**
```bash
cd D10
```

2. **Установите зависимости:**
```bash
npm install
```

3. **Создайте Docker образ:**
```bash
docker build -t ai-code-executor .
```

4. **Создайте файл конфигурации:**
```bash
cp env.example .env
```

5. **Настройте переменные окружения в `.env`:**
```env
PORT=3000
NODE_ENV=development
DOCKER_HOST=unix:///var/run/docker.sock
CONTAINER_TIMEOUT=30000
MAX_CONTAINER_SIZE=100
```

## 🚀 Запуск

### Локальный запуск
```bash
npm start
```

### С Docker Compose
```bash
docker-compose up -d
```

### Режим разработки
```bash
npm run dev
```

## 📖 API Документация

### Выполнение кода
```http
POST /api/execute
Content-Type: application/json

{
  "language": "python",
  "code": "print('Hello, World!')",
  "sessionId": "optional-session-id"
}
```

**Ответ:**
```json
{
  "success": true,
  "containerId": "uuid",
  "result": {
    "output": "Hello, World!",
    "error": "",
    "success": true
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Получение истории
```http
GET /api/history?sessionId=optional&limit=50
```

### Получение статистики
```http
GET /api/stats
```

### Проверка здоровья
```http
GET /api/health
```

### Поддерживаемые языки
```http
GET /api/languages
```

## 🌐 Веб-интерфейс

После запуска сервера откройте `http://localhost:3000` в браузере.

### Возможности веб-интерфейса:
- Выбор языка программирования
- Редактор кода с подсветкой синтаксиса
- Вывод результатов выполнения
- Статистика в реальном времени
- Примеры кода для каждого языка

## 🔒 Безопасность

### Ограничения контейнеров:
- Ограничение памяти: 512MB
- Ограничение CPU: 50%
- Отключение сети
- Запрет привилегированных операций
- Таймаут выполнения: 30 секунд

### Защита от опасных команд:
- Блокировка команд удаления файлов
- Запрет системных вызовов
- Защита от fork bomb
- Ограничение размера кода: 10KB

## 📊 Мониторинг

### Логирование
Все операции логируются в JSON формате:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "INFO",
  "message": "Container created",
  "data": {
    "containerId": "uuid",
    "containerName": "ai-executor-uuid"
  }
}
```

### Метрики
- Количество активных контейнеров
- Общее количество выполнений
- Процент успешных выполнений
- Средняя длина кода
- Статистика по языкам

## 🧪 Тестирование

### Примеры использования

#### Python
```python
import math
print(f"Pi: {math.pi}")
print(f"Square root of 16: {math.sqrt(16)}")
```

#### JavaScript
```javascript
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log(`Sum: ${sum}`);
```

#### Bash
```bash
echo "System info:"
uname -a
echo "Current directory:"
pwd
```

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт сервера | 3000 |
| `NODE_ENV` | Окружение | development |
| `DOCKER_HOST` | Docker socket | unix:///var/run/docker.sock |
| `CONTAINER_TIMEOUT` | Таймаут выполнения (мс) | 30000 |
| `MAX_CONTAINER_SIZE` | Максимум контейнеров | 100 |
| `ALLOWED_ORIGINS` | Разрешенные CORS origins | http://localhost:3000 |
| `LOG_LEVEL` | Уровень логирования | info |

## 🐛 Устранение неполадок

### Проблемы с Docker
```bash
# Проверьте статус Docker
docker info

# Проверьте права доступа к Docker socket
ls -la /var/run/docker.sock
```

### Проблемы с контейнерами
```bash
# Просмотр активных контейнеров
docker ps

# Очистка всех контейнеров
docker system prune -f
```

### Проблемы с сетью
```bash
# Проверьте порт
netstat -tulpn | grep :3000

# Проверьте firewall
sudo ufw status
```

## 📈 Производительность

### Рекомендации:
- Используйте SSD для Docker storage
- Настройте лимиты памяти и CPU
- Мониторьте количество активных контейнеров
- Регулярно очищайте неиспользуемые образы

### Мониторинг ресурсов:
```bash
# Мониторинг Docker
docker stats

# Мониторинг системы
htop
```

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📄 Лицензия

MIT License

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте логи сервера
2. Убедитесь в корректности конфигурации
3. Проверьте статус Docker
4. Создайте issue с подробным описанием проблемы
