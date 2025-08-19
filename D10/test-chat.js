import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3010/api';

async function testChat() {
    console.log('🧪 Тестирование AI Chat\n');

    const sessionId = 'test-chat-' + Date.now();

    // Тест 1: Простой вопрос
    console.log('1️⃣ Тест: "Сложи 2+2"');
    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Сложи 2+2',
                sessionId: sessionId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Ответ AI:', result.llmResponse);
            if (result.hasCode) {
                console.log('📝 Код найден:', result.codeBlocks.length, 'блоков');
                for (const block of result.codeBlocks) {
                    console.log(`   ${block.language}: ${block.code}`);
                }
            }
            if (result.executionResults && result.executionResults.length > 0) {
                console.log('🚀 Результаты выполнения:');
                for (const exec of result.executionResults) {
                    if (exec.result && exec.result.success) {
                        console.log(`   ${exec.language}: ${exec.result.output}`);
                    } else {
                        console.log(`   ${exec.language}: Ошибка - ${exec.error}`);
                    }
                }
            }
        } else {
            console.log('❌ Ошибка:', result.error);
        }
    } catch (error) {
        console.log('❌ Ошибка сети:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Тест 2: Вопрос с циклом
    console.log('2️⃣ Тест: "Покажи числа от 1 до 5"');
    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Покажи числа от 1 до 5',
                sessionId: sessionId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Ответ AI:', result.llmResponse);
            if (result.hasCode) {
                console.log('📝 Код найден:', result.codeBlocks.length, 'блоков');
                for (const block of result.codeBlocks) {
                    console.log(`   ${block.language}: ${block.code}`);
                }
            }
            if (result.executionResults && result.executionResults.length > 0) {
                console.log('🚀 Результаты выполнения:');
                for (const exec of result.executionResults) {
                    if (exec.result && exec.result.success) {
                        console.log(`   ${exec.language}: ${exec.result.output}`);
                    } else {
                        console.log(`   ${exec.language}: Ошибка - ${exec.error}`);
                    }
                }
            }
        } else {
            console.log('❌ Ошибка:', result.error);
        }
    } catch (error) {
        console.log('❌ Ошибка сети:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Тест 3: Получение истории чата
    console.log('3️⃣ Тест получения истории чата');
    try {
        const response = await fetch(`${API_BASE}/chat/history?sessionId=${sessionId}&limit=10`);
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ История получена');
            console.log('📊 Количество сообщений:', result.count);
            console.log('📝 Последние сообщения:');
            result.data.slice(-3).forEach((msg, index) => {
                console.log(`   ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
            });
        } else {
            console.log('❌ Ошибка получения истории:', result.error);
        }
    } catch (error) {
        console.log('❌ Ошибка сети:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Тест 4: Статистика чата
    console.log('4️⃣ Тест статистики чата');
    try {
        const response = await fetch(`${API_BASE}/chat/stats`);
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Статистика получена');
            console.log('📊 Активных разговоров:', result.data.activeConversations);
            console.log('📊 Всего сообщений:', result.data.totalMessages);
            console.log('📊 Среднее сообщений на разговор:', result.data.averageMessagesPerConversation);
        } else {
            console.log('❌ Ошибка получения статистики:', result.error);
        }
    } catch (error) {
        console.log('❌ Ошибка сети:', error.message);
    }

    console.log('\n🎉 Тестирование чата завершено!');
}

// Запуск тестов
testChat().catch(console.error);
