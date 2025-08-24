# 🚀 Cursor-like Code Executor

AI-powered code execution system with project management and file persistence, similar to Cursor IDE. Generates code, saves files to disk, and executes code in isolated containers when needed.

## ✨ Features

- **🤖 AI Code Generation** - Generate code and tests using OpenAI GPT-4
- **📁 Project Management** - Create and manage multiple projects with file trees
- **💾 File Persistence** - Files are saved to disk and persist between sessions
- **🧪 Smart Code Execution** - Execute code only when explicitly requested
- **🎯 Model Selection** - Choose between different OpenAI models
- **🐳 Docker Isolation** - Safe code execution in isolated containers
- **💬 Chat Interface** - Natural language interaction like Cursor
- **💬 Chat History** - Persistent chat history for each project
- **📂 File Viewer** - View and explore project files directly in the interface
- **🗑️ Project Actions** - Clear chat history and delete projects
- **📤 History Export/Import** - Export and import chat history as JSON files
- **⚡ Real-time Execution** - See results immediately
- **🔒 Security** - Rate limiting, input validation, container isolation

## 🛠️ Supported Languages

- **Python** - Full support with pytest
- **JavaScript** - Node.js with Jest
- **TypeScript** - TypeScript with Jest
- **Java** - Java with Maven
- **Go** - Go with built-in testing
- **Rust** - Rust with Cargo

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker
- OpenAI API key

### Installation

1. **Clone and setup:**
```bash
cd D14
npm install
```

2. **Configure environment:**
```bash
cp env.example .env
# Edit .env and add your OpenAI API key
```

3. **Build and start:**
```bash
npm run build
npm start
```

4. **Open in browser:**
```
http://localhost:3010
```

## 💬 Usage Examples

### Create a Project
1. Click "+ New" in the sidebar
2. Enter project name, select language
3. Click "Create Project"

### Generate Code
```
User: "Create a factorial function"

AI: Generates factorial.py with function and tests
Result: File saved to project directory
```

### Execute Code (Optional)
```
User: "Run the factorial function with input 5"

AI: Executes code in Docker container
Result: ✅ Output: 120
```

### Build a Complete Application
```
User: "Create a simple web server with Express"

AI: Generates server.js, package.json, and tests
Result: Complete application structure saved
```

### View Project Files
1. Select a project from the sidebar
2. Click on any file in the file tree
3. View file content in the modal window
4. Close modal to return to chat

### Manage Chat History
1. **Clear History**: Click "Clear History" button in project actions
2. **Export History**: Click "Export History" to download as JSON
3. **Import History**: Click "Import History" to load from JSON file
4. **Auto-save**: History is automatically saved for each project

### Project Actions
1. **Delete Project**: Click "Delete" button to remove project and all files
2. **Switch Projects**: Click different projects to switch between them
3. **File Organization**: Files are automatically categorized by type

## 🏗️ Architecture

### Core Components

- **Project Service** - File system management and project persistence
- **LLM Service** - OpenAI integration with model selection
- **Docker Service** - Container management and code execution
- **Chat Service** - Session management and conversation flow
- **API Routes** - RESTful endpoints with validation

### File Storage

- **Projects Directory**: `./projects/`
- **Project Structure**: Each project has its own directory with files
- **Metadata**: `.project.json` stores project information
- **Persistence**: Files survive server restarts

### Chat History

- **Local Storage**: Chat history is stored in browser's localStorage
- **Project-based**: Each project maintains its own conversation history
- **Export/Import**: Chat history can be exported as JSON and imported
- **Persistence**: History survives browser restarts and project switches

### File Viewer

- **Tree View**: Project files displayed in a hierarchical tree structure
- **File Types**: Files are categorized by type (code, test, config, other)
- **Content View**: Click files to view their content in a modal window
- **Syntax Highlighting**: Basic syntax highlighting for common file types

### Security Features

- **Container Isolation** - Each execution runs in isolated Docker container
- **Resource Limits** - Memory and CPU restrictions
- **Rate Limiting** - Prevents abuse
- **Input Validation** - Zod schema validation
- **Network Isolation** - Containers have no network access

## 📡 API Endpoints

### Projects
```http
POST /api/projects
{
  "name": "My Project",
  "language": "python",
  "description": "Optional description"
}

GET /api/projects
GET /api/projects/:projectId
DELETE /api/projects/:projectId
```

### Files
```http
GET /api/projects/:projectId/files/:filename
DELETE /api/projects/:projectId/files/:filename
```

### Chat
```http
POST /api/chat
{
  "message": "Create a factorial function",
  "projectId": "project-uuid",
  "shouldExecute": false,
  "model": "gpt-4"
}
```

### Code Execution
```http
POST /api/execute
{
  "language": "python",
  "code": "print('Hello World')"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3010 |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | GPT model to use | gpt-4 |
| `MAX_CONTAINERS` | Max concurrent containers | 10 |
| `MEMORY_LIMIT` | Container memory limit (MB) | 512 |
| `CPU_LIMIT` | Container CPU limit (%) | 50 |

## 🐳 Docker Images

The system uses official Docker images:
- `python:3.11-slim` - Python with pytest
- `node:18-slim` - Node.js with Jest
- `openjdk:11-slim` - Java with Maven
- `golang:1.21-alpine` - Go
- `rust:1.75-slim` - Rust

## 📊 Project Structure

```
projects/
├── project-uuid-1/
│   ├── .project.json
│   ├── main.py
│   ├── test_main.py
│   └── requirements.txt
├── project-uuid-2/
│   ├── .project.json
│   ├── server.js
│   ├── package.json
│   └── test/
└── ...
```

## 🎯 Model Selection

Available models:
- **GPT-4** - Most capable, best for complex tasks
- **GPT-4 Turbo** - Faster, good balance
- **GPT-3.5 Turbo** - Fastest, cost-effective

## 🔒 Security

### Container Security
- No privileged access
- Read-only root filesystem (where possible)
- Dropped capabilities
- Network isolation
- Resource limits

### Application Security
- Input validation with Zod
- Rate limiting
- CORS protection
- Helmet security headers
- Request size limits

## 🧪 Testing

```bash
# Run tests
npm test

# Development mode
npm run dev

# Linting
npm run lint
```

## 📈 Performance

- **Response Time**: < 5 seconds for most requests
- **Container Startup**: < 2 seconds (only when executing)
- **Concurrent Executions**: Up to 10 containers
- **Memory Usage**: ~50MB per container
- **CPU Usage**: Limited to 50% per container

## 🚨 Troubleshooting

### Common Issues

1. **Docker not running**
   ```bash
   docker info
   # Start Docker if needed
   ```

2. **OpenAI API errors**
   ```bash
   # Check API key in .env
   echo $OPENAI_API_KEY
   ```

3. **Port conflicts**
   ```bash
   # Change port in .env
   PORT=3011
   ```

4. **Project files not saving**
   ```bash
   # Check permissions on projects directory
   ls -la projects/
   ```

### Logs
```bash
# View logs
tail -f logs/combined.log

# View errors
tail -f logs/error.log
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License

## 🆘 Support

- Check logs in `logs/` directory
- Verify Docker is running
- Ensure OpenAI API key is valid
- Check project directory permissions
- Verify container limits and resources

## 🔄 Migration from v1.0

If you're upgrading from the previous version:

1. **Backup existing data** - Old sessions are not compatible
2. **Update environment** - Check new environment variables
3. **Restart server** - New project system will be initialized
4. **Create new projects** - Use the new project management interface

The new version provides better file persistence and project organization while maintaining the same AI-powered code generation capabilities.
