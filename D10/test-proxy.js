import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Проверка прокси соединения...\n');

// Получаем настройки прокси
const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.https_proxy;

if (!proxyUrl) {
    console.log('❌ Прокси не настроен');
    console.log('💡 Добавьте в .env файл:');
    console.log('   HTTP_PROXY=socks5://127.0.0.1:2080');
    console.log('   HTTPS_PROXY=socks5://127.0.0.1:2080');
    console.log('   (или настройте порт вашего Nekoray)');
    process.exit(1);
}

console.log('✅ Прокси URL найден:', proxyUrl);

// Создаем соответствующий агент в зависимости от типа прокси
let agent;
if (proxyUrl.startsWith('socks5://') || proxyUrl.startsWith('socks4://')) {
  agent = new SocksProxyAgent(proxyUrl);
  console.log('🔧 Используем SOCKS прокси');
} else {
  agent = new HttpsProxyAgent(proxyUrl);
  console.log('🔧 Используем HTTP прокси');
}

console.log('🔄 Тестируем соединение через прокси...');

try {
    // Тестируем соединение к ifconfig.io через прокси
    const response = await fetch('https://ifconfig.io', {
        agent: agent
    });
    
    if (response.ok) {
        const ip = await response.text();
        console.log('✅ Прокси работает!');
        console.log('🌐 Ваш IP через прокси:', ip.trim());
        
        // Тестируем OpenAI API
        console.log('\n🔄 Тестируем OpenAI API через прокси...');
        
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            agent: agent
        });
        
        if (openaiResponse.ok) {
            console.log('✅ OpenAI API доступен через прокси!');
            const data = await openaiResponse.json();
            console.log('📝 Доступные модели:', data.data.length);
        } else {
            console.log('❌ OpenAI API недоступен через прокси');
            console.log('Статус:', openaiResponse.status);
        }
        
    } else {
        console.log('❌ Ошибка при тестировании прокси');
        console.log('Статус:', response.status);
    }
} catch (error) {
    console.log('❌ Ошибка соединения:', error.message);
    console.log('\n💡 Возможные решения:');
    console.log('1. Убедитесь, что Nekoray запущен');
    console.log('2. Проверьте порт прокси (обычно 7890)');
    console.log('3. Проверьте настройки прокси в .env файле');
}
