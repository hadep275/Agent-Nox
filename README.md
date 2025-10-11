# 🦊 Nox - Your AI Coding Fox

A clever AI coding companion for enterprise-scale development. Nox brings the cunning intelligence of a fox to your VS Code workspace.

## 🚀 Features

- **🔑 Your API Keys, Your Control**: Use your own API keys for complete privacy and cost control
- **🚀 Multi-AI Provider Support**: Anthropic Claude, OpenAI GPT-4, DeepSeek, Local LLMs
- **⚡ Enterprise Performance**: Designed for codebases with 100K+ files
- **🧠 Intelligent Context**: Advanced code understanding and context retrieval
- **📊 Audit & Compliance**: Complete change tracking and audit trails
- **💰 Cost Optimization**: Real-time cost tracking and intelligent model selection
- **🦊 Fox-Themed UI**: Beautiful, intuitive interface with your clever coding companion

## 📋 Current Status - Phase 1 Complete

### ✅ Foundation Implemented

- [x] VS Code extension structure and manifest
- [x] Enterprise-grade logging system
- [x] Performance monitoring and metrics
- [x] Main agent controller architecture
- [x] Basic command handlers (Chat, Explain, Refactor, Analyze)
- [x] Audit logging for compliance
- [x] Core component placeholders

### 🔄 Phase 2 - Core Features (Next)

- [ ] AI provider implementations (Anthropic, OpenAI, DeepSeek)
- [ ] File indexing and context retrieval
- [ ] Chat UI with Aurora theming
- [ ] Multi-file coordinated edits
- [ ] Streaming responses

### 🔄 Phase 3 - Enterprise Features (Future)

- [ ] Performance dashboard
- [ ] Advanced analytics and ROI tracking
- [ ] Team collaboration features
- [ ] Advanced integrations (Git, JIRA, Slack)

## 🏗️ Architecture

```
Nox/
├── package.json                    # VS Code extension manifest
├── extension.js                   # Main entry point
├── src/
│   ├── commands/                  # Command handlers
│   │   ├── chatCommand.js         # 🦊 Chat with Nox
│   │   ├── explainCommand.js      # 🧠 Code explanations
│   │   ├── refactorCommand.js     # ⚡ Smart refactoring
│   │   └── analyzeCommand.js      # 📊 Codebase analysis
│   ├── core/                      # Core infrastructure
│   │   ├── agentController.js     # 🎯 Main orchestrator
│   │   ├── aiClient.js           # 🤖 AI provider client
│   │   ├── contextManager.js     # 🧠 Context retrieval
│   │   ├── fileOps.js            # 📁 File operations
│   │   ├── indexEngine.js        # 🔍 Code indexing
│   │   └── performanceMonitor.js # 📈 Metrics & monitoring
│   ├── enterprise/               # Enterprise features
│   │   └── auditLogger.js        # 📋 Audit & compliance
│   ├── storage/                  # Data layer
│   │   └── cacheManager.js       # ⚡ Caching system
│   └── utils/                    # Utilities
│       └── logger.js             # 📝 Structured logging
└── README.md                     # This file
```

## 🛠️ Installation & Development

### Prerequisites

- VS Code 1.80.0 or higher
- Node.js 18.0 or higher

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Open in VS Code
4. Press F5 to launch extension in development mode

### Testing

```bash
npm test
```

### Packaging

```bash
npm run package
```

## ⚙️ Configuration

The extension can be configured through VS Code settings:

```json
{
  "nox.aiProvider": "anthropic",
  "nox.anthropic.apiKey": "your-api-key-here",
  "nox.openai.apiKey": "your-openai-key-here",
  "nox.deepseek.apiKey": "your-deepseek-key-here",
  "nox.enableTelemetry": true,
  "nox.maxContextSize": 100000,
  "nox.enableCaching": true,
  "nox.logLevel": "info"
}
```

## 🎯 Commands

- **🦊 Nox: Start Chat** - Open chat interface with your AI fox
- **🦊 Nox: Explain Code** - Get clever explanations for selected code
- **🦊 Nox: Refactor Code** - Smart refactoring suggestions
- **🦊 Nox: Analyze Codebase** - Comprehensive codebase analysis
- **🦊 Nox: Performance Dashboard** - View metrics and costs (coming soon)
- **🦊 Nox: Settings** - Configure your AI fox (coming soon)

## 📊 Enterprise Features

### Performance Monitoring

- Real-time metrics collection
- API cost tracking
- Response time monitoring
- Memory usage tracking

### Audit & Compliance

- Complete change history
- User action tracking
- AI interaction logging
- Session management

### Logging

- Structured JSON logging
- Multiple output channels
- Configurable log levels
- Persistent log files

## 🔒 Security & Privacy

- Secure API key storage using VS Code SecretStorage
- Local data processing where possible
- Audit trails for compliance
- No data sent without explicit user action

## 🤝 Contributing

This is an enterprise-grade project. Please ensure:

- Comprehensive error handling
- Performance considerations
- Proper logging and metrics
- Security best practices
- Enterprise-quality code

## 📄 License

MIT License - See LICENSE file for details

## 🚀 Roadmap

### Phase 2: Core AI Features

- Multi-provider AI integration
- Intelligent context retrieval
- Real-time chat interface
- File indexing and search

### Phase 3: Enterprise Scale

- Advanced analytics dashboard
- Team collaboration features
- Enterprise integrations
- Advanced security features

---

**🦊 Nox** - Your clever AI coding fox, bringing enterprise-grade intelligence to your development workflow.
