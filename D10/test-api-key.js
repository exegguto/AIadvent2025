import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Проверка OpenAI API ключа...\n');

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.log('❌ OPENAI_API_KEY не найден в переменных окружения');
    console.log('💡 Добавьте в .env файл: OPENAI_API_KEY=your_actual_key_here');
    process.exit(1);
}

if (apiKey === 'your_openai_api_key_here') {
    console.log('❌ OPENAI_API_KEY установлен как placeholder');
    console.log('💡 Замените на реальный API ключ в .env файле');
    process.exit(1);
}

console.log('✅ API ключ найден');
console.log(`📝 Первые 10 символов: ${apiKey.substring(0, 10)}...`);
console.log(`📏 Длина ключа: ${apiKey.length} символов`);

// Проверяем формат ключа (должен начинаться с sk-)
if (!apiKey.startsWith('sk-')) {
    console.log('⚠️  Предупреждение: API ключ не начинается с "sk-"');
    console.log('💡 Убедитесь, что это правильный OpenAI API ключ');
}

console.log('\n🚀 API ключ готов к использованию!');
console.log('💡 Теперь система будет использовать настоящий LLM вместо fallback');
