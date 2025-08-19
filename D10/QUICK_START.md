# 🚀 Быстрый старт

## 1. Запуск одной командой
```bash
./start.sh
```

## 2. Ручной запуск
```bash
# Установка зависимостей
npm install

# Создание Docker образа
docker build -t ai-code-executor .

# Запуск сервера
npm start
```

## 3. Доступ к приложению
- 🌐 Веб-интерфейс: http://localhost:3000
- 📚 API: http://localhost:3000/api
- 🧪 Тесты: `node test.js`

## 4. Пример использования API
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(\"Hello, World!\")"
  }'
```

## 5. Остановка
```bash
# Ctrl+C в терминале или
docker-compose down
```

## 🆘 Проблемы?
1. Убедитесь, что Docker запущен
2. Проверьте права доступа к Docker socket
3. См. полную документацию в README.md
