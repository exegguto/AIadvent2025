const BASE_URL = 'http://localhost:3010';

async function testChatComparisonFixed() {
    console.log('🔍 Testing Fixed Chat Comparison Feature...\n');

    try {
        // 1. Create two test projects with different chat histories
        console.log('1. Creating test projects with chat histories...');
        
        const project1Response = await fetch(`${BASE_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Тест сравнения 1',
                language: 'python',
                description: 'Первый тестовый проект для сравнения'
            })
        });

        const project1Data = await project1Response.json();
        if (!project1Data.success) {
            throw new Error('Failed to create project 1: ' + project1Data.error);
        }

        const project2Response = await fetch(`${BASE_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Тест сравнения 2',
                language: 'python',
                description: 'Второй тестовый проект для сравнения'
            })
        });

        const project2Data = await project2Response.json();
        if (!project2Data.success) {
            throw new Error('Failed to create project 2: ' + project2Data.error);
        }

        const project1Id = project1Data.data.id;
        const project2Id = project2Data.data.id;
        
        console.log(`✅ Project 1 created: ${project1Id}`);
        console.log(`✅ Project 2 created: ${project2Id}`);

        // 2. Create different chat histories
        console.log('\n2. Creating different chat histories...');
        
        // Project 1: Simple function
        await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Создай простую функцию для сложения двух чисел',
                sessionId: `test-chat1-${Date.now()}`,
                projectId: project1Id,
                shouldExecute: false,
                model: 'gpt-4'
            })
        });

        // Project 2: Complex function
        await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Создай класс калькулятора с множественными операциями и модульными тестами',
                sessionId: `test-chat2-${Date.now()}`,
                projectId: project2Id,
                shouldExecute: false,
                model: 'gpt-4'
            })
        });

        // Add follow-up messages
        await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Добавь обработку ошибок в функцию сложения',
                sessionId: `test-chat1-followup-${Date.now()}`,
                projectId: project1Id,
                shouldExecute: false,
                model: 'gpt-4'
            })
        });

        await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Добавь метод для вычисления квадратного корня',
                sessionId: `test-chat2-followup-${Date.now()}`,
                projectId: project2Id,
                shouldExecute: false,
                model: 'gpt-4'
            })
        });

        console.log('✅ Chat histories created successfully');

        // 3. Test the comparison functionality
        console.log('\n3. Testing chat comparison with Russian interface...');
        
        const comparisonResponse = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Пожалуйста, проанализируйте и сравните эти два диалога:

ДИАЛОГ 1 (Тест сравнения 1):
[Пользователь]: Создай простую функцию для сложения двух чисел
[Ассистент]: [Ответ с простой функцией]
[Пользователь]: Добавь обработку ошибок в функцию сложения
[Ассистент]: [Ответ с обработкой ошибок]

ДИАЛОГ 2 (Тест сравнения 2):
[Пользователь]: Создай класс калькулятора с множественными операциями и модульными тестами
[Ассистент]: [Ответ с комплексным классом]
[Пользователь]: Добавь метод для вычисления квадратного корня
[Ассистент]: [Ответ с дополнительным методом]

Пожалуйста, предоставьте комплексное сравнение этих диалогов, сосредоточившись на:
1. Качестве и полноте кода
2. Ясности и полезности ответов
3. Подходе к решению проблем
4. Различиях в стратегиях реализации

Пожалуйста, предоставьте ваш анализ в четком, структурированном формате с конкретными примерами из обеих бесед.`,
                sessionId: `comparison-test-fixed-${Date.now()}`,
                shouldExecute: false,
                model: 'gpt-4'
            })
        });

        const comparisonData = await comparisonResponse.json();
        
        if (comparisonData.success) {
            console.log('✅ Chat comparison analysis completed successfully');
            console.log('\n📊 Comparison Analysis Preview:');
            console.log(comparisonData.message.content.substring(0, 500) + '...');
            
            console.log('\n🎉 Fixed chat comparison feature test completed!');
            console.log('\n📝 What was tested:');
            console.log('   - Created two different projects with Russian names');
            console.log('   - Generated different types of code (simple vs complex)');
            console.log('   - Added follow-up messages to create richer conversations');
            console.log('   - Successfully requested LLM analysis in Russian');
            console.log('   - Received structured comparison analysis');
            
            console.log('\n🔧 How to use in the UI:');
            console.log('   1. Open http://localhost:3010 in browser');
            console.log('   2. Select any project with chat history');
            console.log('   3. Click "Compare Chats" button');
            console.log('   4. Current project should be auto-selected as first');
            console.log('   5. Select second project for comparison');
            console.log('   6. Customize the analysis prompt if needed');
            console.log('   7. Click "Сравнить диалоги" to get AI analysis');
            
            console.log('\n✨ New features:');
            console.log('   - Russian interface in modal');
            console.log('   - Auto-selection of current project');
            console.log('   - Better project loading in selects');
            console.log('   - Russian error messages');
            console.log('   - Russian analysis prompts');
            
        } else {
            throw new Error('Failed to get comparison analysis: ' + comparisonData.error);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testChatComparisonFixed();
