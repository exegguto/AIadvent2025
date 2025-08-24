const BASE_URL = 'http://localhost:3010';

async function testFileCreationDebug() {
    console.log('🔍 Testing File Creation Debug...\n');

    try {
        // 1. Create a test project
        console.log('1. Creating test project...');
        const createResponse = await fetch(`${BASE_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'File Creation Debug Test',
                language: 'python',
                description: 'Test project for debugging file creation'
            })
        });

        const createData = await createResponse.json();
        if (!createData.success) {
            throw new Error('Failed to create project: ' + createData.error);
        }

        const projectId = createData.data.id;
        console.log(`✅ Project created: ${projectId}`);

        // 2. Send a message that should generate files
        console.log('\n2. Sending message to generate files...');
        const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Create a simple Python function to calculate factorial',
                sessionId: `test-file-debug-${Date.now()}`,
                projectId: projectId,
                shouldExecute: false,
                model: 'gpt-4'
            })
        });

        const chatData = await chatResponse.json();
        if (!chatData.success) {
            throw new Error('Failed to send message: ' + chatData.error);
        }

        console.log('✅ Message sent successfully');
        console.log(`Response has code blocks: ${chatData.message.codeBlocks ? chatData.message.codeBlocks.length : 0}`);

        if (chatData.message.codeBlocks && chatData.message.codeBlocks.length > 0) {
            console.log('Code blocks found:');
            chatData.message.codeBlocks.forEach((block, index) => {
                console.log(`  Block ${index + 1}:`);
                console.log(`    Language: ${block.language}`);
                console.log(`    Filename: ${block.filename || 'NO FILENAME'}`);
                console.log(`    Code length: ${block.code.length}`);
                console.log(`    Code preview: ${block.code.substring(0, 100)}...`);
            });
        } else {
            console.log('❌ No code blocks in response');
        }

        // 3. Wait a moment for file processing
        console.log('\n3. Waiting for file processing...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 4. Check project files
        console.log('\n4. Checking project files...');
        const projectResponse = await fetch(`${BASE_URL}/api/projects/${projectId}`);
        const projectData = await projectResponse.json();

        if (!projectData.success) {
            throw new Error('Failed to get project: ' + projectData.error);
        }

        console.log(`✅ Project has ${projectData.data.files.length} files:`);
        projectData.data.files.forEach(file => {
            console.log(`  - ${file.name} (${file.type}) - ${file.content.length} chars`);
        });

        // 5. Test file reading
        if (projectData.data.files.length > 0) {
            console.log('\n5. Testing file reading...');
            const testFile = projectData.data.files[0];
            const fileResponse = await fetch(`${BASE_URL}/api/projects/${projectId}/files/${encodeURIComponent(testFile.name)}`);
            const fileData = await fileResponse.json();

            if (fileData.success) {
                console.log(`✅ File ${testFile.name} can be read`);
                console.log(`Content preview: ${fileData.data.content.substring(0, 200)}...`);
            } else {
                console.log(`❌ Failed to read file: ${fileData.error}`);
            }
        }

        console.log('\n🎉 File creation debug test completed!');
        console.log('\n📝 Analysis:');
        console.log('   - Check if LLM is generating code blocks');
        console.log('   - Check if code blocks have filenames');
        console.log('   - Check if files are being saved to project');
        console.log('   - Check server logs for file creation messages');

        console.log('\n🔧 Next steps:');
        console.log('   - Check server logs for "Saving generated files to project"');
        console.log('   - Check server logs for "File saved successfully"');
        console.log('   - Check server logs for any errors');
        console.log('   - Verify that LLM is generating proper code blocks');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testFileCreationDebug();
