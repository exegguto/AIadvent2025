import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3010/api';

async function testAPI() {
    console.log('🧪 Тестирование AI Code Executor API\n');

    // Тест 1: Проверка здоровья сервиса
    console.log('1️⃣ Тест здоровья сервиса...');
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        console.log('✅ Сервис работает:', data.status);
    } catch (error) {
        console.log('❌ Ошибка:', error.message);
        return;
    }

    // Тест 2: Получение поддерживаемых языков
    console.log('\n2️⃣ Получение поддерживаемых языков...');
    try {
        const response = await fetch(`${API_BASE}/languages`);
        const data = await response.json();
        console.log('✅ Поддерживаемые языки:', data.data.languages.map(l => l.name).join(', '));
    } catch (error) {
        console.log('❌ Ошибка:', error.message);
    }

    // Тест 3: Выполнение Python кода
    console.log('\n3️⃣ Тест выполнения Python кода...');
    try {
        const response = await fetch(`${API_BASE}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'python',
                code: 'print("Hello from Python!")\nfor i in range(3):\n    print(f"Count: {i}")',
                sessionId: 'test-session'
            })
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Python код выполнен успешно');
            console.log('📋 Вывод:', data.result.output);
        } else {
            console.log('❌ Ошибка выполнения:', data.error);
        }
    } catch (error) {
        console.log('❌ Ошибка:', error.message);
    }

    // Тест 4: Выполнение JavaScript кода
    console.log('\n4️⃣ Тест выполнения JavaScript кода...');
    try {
        const response = await fetch(`${API_BASE}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'javascript',
                code: 'console.log("Hello from JavaScript!");\nconst sum = [1,2,3,4,5].reduce((a,b) => a+b, 0);\nconsole.log("Sum:", sum);',
                sessionId: 'test-session'
            })
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ JavaScript код выполнен успешно');
            console.log('📋 Вывод:', data.result.output);
        } else {
            console.log('❌ Ошибка выполнения:', data.error);
        }
    } catch (error) {
        console.log('❌ Ошибка:', error.message);
    }

    // Тест 5: Получение статистики
    console.log('\n5️⃣ Получение статистики...');
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Статистика получена');
            console.log('📊 Активных контейнеров:', data.data.containers.activeContainers);
            console.log('📊 Всего выполнений:', data.data.history.totalExecutions);
        } else {
            console.log('❌ Ошибка получения статистики:', data.error);
        }
    } catch (error) {
        console.log('❌ Ошибка:', error.message);
    }

    // Тест 6: Получение истории
    console.log('\n6️⃣ Получение истории выполнений...');
    try {
        const response = await fetch(`${API_BASE}/history?sessionId=test-session&limit=5`);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ История получена');
            console.log('📊 Количество записей:', data.count);
        } else {
            console.log('❌ Ошибка получения истории:', data.error);
        }
    } catch (error) {
        console.log('❌ Ошибка:', error.message);
    }

    console.log('\n🎉 Тестирование завершено!');
}

// Запуск тестов
testAPI().catch(console.error);
