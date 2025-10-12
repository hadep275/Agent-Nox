const vscode = require("vscode");

/**
 * 🦊 Nox Chat Panel - Simple Working Version
 * Aurora-themed chat interface with fox mascot
 */
class ChatPanel {
  constructor(context, agentController, logger) {
    this.context = context;
    this.agentController = agentController;
    this.logger = logger;
    this.panel = null;
    this.disposables = [];
    this.chatHistory = [];
    this.isAIResponding = false;
  }

  /**
   * 🎨 Create or show the chat panel
   */
  static createOrShow(context, agentController, logger) {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : vscode.ViewColumn.One;

    // If we already have a panel, show it
    if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel.panel.reveal(column);
      return ChatPanel.currentPanel;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      "noxChat",
      "🦊 Nox Chat",
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    ChatPanel.currentPanel = new ChatPanel(context, agentController, logger);
    ChatPanel.currentPanel.panel = panel;
    ChatPanel.currentPanel.initialize();

    return ChatPanel.currentPanel;
  }

  /**
   * 🔧 Initialize the webview panel
   */
  initialize() {
    this.panel.webview.html = this.getWebviewContent();
    this.setupMessageHandling();
    this.setupPanelEvents();
    this.loadChatHistory();
    this.logger.info("🦊 Chat panel initialized successfully");
  }

  /**
   * 📨 Set up message handling between webview and extension
   */
  setupMessageHandling() {
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        try {
          switch (message.type) {
            case "sendMessage":
              await this.handleUserMessage(message.content);
              break;
            case "clearHistory":
              await this.clearChatHistory();
              break;
            case "ready":
              await this.sendInitialData();
              break;
            case "setApiKey":
              await this.handleSetApiKey(message.provider, message.apiKey);
              break;
            case "removeApiKey":
              await this.handleRemoveApiKey(message.provider);
              break;
            case "getApiKeyStatus":
              await this.sendApiKeyStatus();
              break;
            case "switchProvider":
              await this.handleSwitchProvider(message.provider);
              break;
            case "executeCommand":
              await this.handleExecuteCommand(message.command);
              break;
            default:
              this.logger.warn(`Unknown message type: ${message.type}`);
          }
        } catch (error) {
          this.logger.error("Error handling webview message:", error);
          this.sendErrorToWebview(error.message);
        }
      },
      null,
      this.disposables
    );
  }

  /**
   * 🎛️ Set up panel lifecycle events
   */
  setupPanelEvents() {
    this.panel.onDidDispose(
      () => {
        this.dispose();
      },
      null,
      this.disposables
    );
  }

  /**
   * 💬 Handle user message and get AI response
   */
  async handleUserMessage(userMessage) {
    if (this.isAIResponding) {
      this.sendErrorToWebview(
        "Please wait for the current response to complete."
      );
      return;
    }

    try {
      this.isAIResponding = true;

      // Add user message to history
      const userMessageObj = {
        id: Date.now().toString(),
        type: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      };

      this.chatHistory.push(userMessageObj);
      this.saveChatHistory();

      // Send user message to webview
      this.sendMessageToWebview({
        type: "userMessage",
        message: userMessageObj,
      });

      // Show AI thinking indicator
      this.sendMessageToWebview({
        type: "aiThinking",
        thinking: true,
      });

      // Get AI response using existing AIClient
      const aiResponse = await this.agentController.aiClient.sendRequest(
        userMessage,
        { maxTokens: 4000 }
      );

      // Create AI message object
      const aiMessageObj = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        provider: this.agentController.aiClient.currentProvider,
        model: aiResponse.model || "unknown",
        tokens: aiResponse.usage || {},
      };

      this.chatHistory.push(aiMessageObj);
      this.saveChatHistory();

      // Send AI response to webview
      this.sendMessageToWebview({
        type: "aiMessage",
        message: aiMessageObj,
      });

      // Hide thinking indicator
      this.sendMessageToWebview({
        type: "aiThinking",
        thinking: false,
      });

      this.logger.info(`🦊 Chat exchange completed successfully`);
    } catch (error) {
      this.logger.error("Error in chat exchange:", error);

      // Hide thinking indicator
      this.sendMessageToWebview({
        type: "aiThinking",
        thinking: false,
      });

      // Send error message
      this.sendErrorToWebview(error.message);
    } finally {
      this.isAIResponding = false;
    }
  }

  /**
   * 📤 Send message to webview
   */
  sendMessageToWebview(message) {
    if (this.panel && this.panel.webview) {
      this.panel.webview.postMessage(message);
    }
  }

  /**
   * ❌ Send error message to webview
   */
  sendErrorToWebview(errorMessage) {
    this.sendMessageToWebview({
      type: "error",
      content: errorMessage,
    });
  }

  /**
   * 🔄 Send initial data when webview is ready
   */
  async sendInitialData() {
    try {
      // Send chat history
      this.sendMessageToWebview({
        type: "chatHistory",
        history: this.chatHistory,
      });

      // Send current AI provider info
      const currentProvider = this.agentController.aiClient.currentProvider;
      const providers = this.agentController.aiClient.providers;

      this.sendMessageToWebview({
        type: "providerInfo",
        currentProvider,
        providers,
      });

      this.logger.info("🦊 Initial data sent to webview");
    } catch (error) {
      this.logger.error("Error sending initial data:", error);
    }
  }

  /**
   * 💾 Load chat history from storage
   */
  loadChatHistory() {
    try {
      const stored = this.context.workspaceState.get("nox.chatHistory", []);
      this.chatHistory = Array.isArray(stored) ? stored : [];
      this.logger.info(`🦊 Loaded ${this.chatHistory.length} chat messages`);
    } catch (error) {
      this.logger.error("Error loading chat history:", error);
      this.chatHistory = [];
    }
  }

  /**
   * 💾 Save chat history to storage
   */
  saveChatHistory() {
    try {
      // Keep only last 100 messages to prevent storage bloat
      const historyToSave = this.chatHistory.slice(-100);
      this.context.workspaceState.update("nox.chatHistory", historyToSave);
    } catch (error) {
      this.logger.error("Error saving chat history:", error);
    }
  }

  /**
   * 🗑️ Clear chat history
   */
  async clearChatHistory() {
    try {
      this.chatHistory = [];
      await this.context.workspaceState.update("nox.chatHistory", []);

      this.sendMessageToWebview({
        type: "historyCleared",
      });

      this.logger.info("🦊 Chat history cleared");
    } catch (error) {
      this.logger.error("Error clearing chat history:", error);
    }
  }

  /**
   * 🔑 Handle setting API key
   */
  async handleSetApiKey(provider, apiKey) {
    try {
      await this.agentController.aiClient.setApiKey(provider, apiKey);
      this.logger.info(`🦊 API key set for provider: ${provider}`);

      // Send updated status
      await this.sendApiKeyStatus();
    } catch (error) {
      this.logger.error(`Error setting API key for ${provider}:`, error);
      this.sendErrorToWebview(
        `Failed to set API key for ${provider}: ${error.message}`
      );
    }
  }

  /**
   * 🗑️ Handle removing API key
   */
  async handleRemoveApiKey(provider) {
    try {
      await this.agentController.aiClient.removeApiKey(provider);
      this.logger.info(`🦊 API key removed for provider: ${provider}`);

      // Send updated status
      await this.sendApiKeyStatus();
    } catch (error) {
      this.logger.error(`Error removing API key for ${provider}:`, error);
      this.sendErrorToWebview(
        `Failed to remove API key for ${provider}: ${error.message}`
      );
    }
  }

  /**
   * 📊 Send API key status to webview
   */
  async sendApiKeyStatus() {
    try {
      const providers = ["anthropic", "openai", "deepseek", "local"];
      const status = {};

      for (const provider of providers) {
        status[provider] = await this.agentController.aiClient.hasValidApiKey(
          provider
        );
      }

      this.sendMessageToWebview({
        type: "apiKeyStatus",
        status: status,
      });
    } catch (error) {
      this.logger.error("Error getting API key status:", error);
    }
  }

  /**
   * 🔄 Handle switching AI provider
   */
  async handleSwitchProvider(provider) {
    try {
      // Update the current provider in AIClient
      this.agentController.aiClient.currentProvider = provider;

      // Save to configuration
      await this.agentController.updateConfiguration({
        currentProvider: provider,
      });

      this.logger.info(`🦊 Switched to provider: ${provider}`);

      // Send updated provider info
      const currentProvider = this.agentController.aiClient.currentProvider;
      const providers = this.agentController.aiClient.providers;

      this.sendMessageToWebview({
        type: "providerSwitched",
        currentProvider,
        providers,
      });
    } catch (error) {
      this.logger.error(`Error switching to provider ${provider}:`, error);
      this.sendErrorToWebview(
        `Failed to switch to ${provider}: ${error.message}`
      );
    }
  }

  /**
   * ⚡ Handle executing Nox commands
   */
  async handleExecuteCommand(command) {
    try {
      this.logger.info(`🦊 Executing command: ${command}`);

      // Execute the VS Code command
      const result = await vscode.commands.executeCommand(command);

      this.sendMessageToWebview({
        type: "commandExecuted",
        result: { success: true, command, result },
      });

      this.logger.info(`🦊 Command executed successfully: ${command}`);
    } catch (error) {
      this.logger.error(`Error executing command ${command}:`, error);

      this.sendMessageToWebview({
        type: "commandExecuted",
        result: { success: false, command, error: error.message },
      });
    }
  }

  /**
   * 🧹 Dispose of the panel and clean up resources
   */
  dispose() {
    ChatPanel.currentPanel = null;

    // Clean up resources
    this.panel.dispose();

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }

    this.logger.info("🦊 Chat panel disposed");
  }

  /**
   * 🎨 Get the webview HTML content
   */
  getWebviewContent() {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src https:;">
        <title>🦊 Nox Chat</title>
        ${this.getWebviewCSS()}
    </head>
    <body>
        <div class="aurora-bg"></div>
        <div class="chat-container">
            <!-- Header -->
            <div class="chat-header">
                <div class="header-left">
                    <div class="fox-avatar">🦊</div>
                    <div class="header-title">Nox Chat</div>
                </div>
                <div class="header-actions">
                    <button class="header-btn" id="settingsBtn" title="Settings">⚙️</button>
                    <button class="header-btn" id="clearBtn" title="Clear History">🗑️</button>
                </div>
            </div>

            <!-- Messages Area -->
            <div class="chat-messages" id="chatMessages">
                <div class="empty-state" id="emptyState">
                    <div class="empty-fox">🦊</div>
                    <div class="empty-title">Hello! I'm Nox</div>
                    <div class="empty-subtitle">Your clever AI coding fox. Ask me anything about your code!</div>
                </div>
            </div>

            <!-- Thinking Indicator -->
            <div class="thinking-indicator hidden" id="thinkingIndicator">
                <div class="thinking-content">
                    <span class="fox-thinking">🦊</span>
                    <div class="thinking-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span class="thinking-text">Nox is thinking...</span>
                </div>
            </div>

            <!-- Settings Panel -->
            <div class="settings-panel hidden" id="settingsPanel">
                <div class="settings-content">
                    <div class="settings-header">
                        <h2>⚙️ Nox Settings</h2>
                        <button class="close-btn" id="closeSettingsBtn">✕</button>
                    </div>

                    <div class="settings-body">
                        <!-- API Keys Section -->
                        <div class="settings-section">
                            <h3>🔑 API Keys</h3>
                            <div class="api-keys-grid" id="apiKeysGrid">
                                <!-- API key inputs will be populated here -->
                            </div>
                        </div>

                        <!-- Provider Selection -->
                        <div class="settings-section">
                            <h3>🤖 AI Provider</h3>
                            <div class="provider-grid" id="providerGrid">
                                <!-- Provider options will be populated here -->
                            </div>
                        </div>

                        <!-- Nox Commands -->
                        <div class="settings-section">
                            <h3>🦊 Nox Commands</h3>
                            <div class="commands-grid">
                                <button class="command-btn" data-command="nox.explain">
                                    <span class="command-icon">📖</span>
                                    <span class="command-text">Explain Code</span>
                                </button>
                                <button class="command-btn" data-command="nox.refactor">
                                    <span class="command-icon">🔧</span>
                                    <span class="command-text">Refactor Code</span>
                                </button>
                                <button class="command-btn" data-command="nox.analyze">
                                    <span class="command-icon">🔍</span>
                                    <span class="command-text">Analyze Code</span>
                                </button>
                                <button class="command-btn" data-command="nox.dashboard">
                                    <span class="command-icon">📊</span>
                                    <span class="command-text">Dashboard</span>
                                </button>
                            </div>
                        </div>

                        <!-- User Profile -->
                        <div class="settings-section">
                            <h3>👤 User Profile</h3>
                            <div class="profile-info">
                                <div class="profile-avatar">🦊</div>
                                <div class="profile-details">
                                    <div class="profile-name">Nox User</div>
                                    <div class="profile-role">AI Coding Assistant User</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Input Area -->
            <div class="chat-input-container">
                <div class="provider-info" id="providerInfo">
                    <span>Provider:</span>
                    <span class="provider-badge" id="currentProvider">Loading...</span>
                </div>
                <div class="chat-input-wrapper">
                    <textarea
                        class="chat-input"
                        id="chatInput"
                        placeholder="Ask Nox anything about your code..."
                        rows="1"
                    ></textarea>
                    <button class="send-btn" id="sendBtn" disabled>
                        <span>🚀</span>
                    </button>
                </div>
            </div>
        </div>

        <script nonce="${nonce}">
            ${this.getWebviewJS()}
        </script>
    </body>
    </html>`;
  }

  /**
   * 🎨 Get Aurora-themed CSS styles
   */
  getWebviewCSS() {
    return `<style>
      /* 🦊 Nox Aurora Theme CSS */
      :root {
          --aurora-blue: #4c9aff;
          --aurora-purple: #8b5cf6;
          --aurora-green: #10b981;
          --aurora-pink: #f472b6;
          --aurora-cyan: #06b6d4;
          --aurora-orange: #ff6b35;

          --bg-primary: #0a0a0f;
          --bg-secondary: #1a1a2e;
          --bg-tertiary: #16213e;
          --bg-chat: #0f1419;
          --text-primary: #ffffff;
          --text-secondary: #a0a9c0;
          --text-muted: #6b7280;

          --gradient-aurora: linear-gradient(135deg, var(--aurora-blue), var(--aurora-purple), var(--aurora-green));
          --gradient-fox: linear-gradient(135deg, var(--aurora-orange), #f7931e, #ffcd3c);
          --gradient-message: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));

          --shadow-glow: 0 0 20px rgba(76, 154, 255, 0.2);
          --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.3);
          --shadow-message: 0 2px 10px rgba(0, 0, 0, 0.2);
      }

      * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
      }

      body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: var(--bg-primary);
          color: var(--text-primary);
          height: 100vh;
          overflow: hidden;
          position: relative;
      }

      .aurora-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at top, rgba(76, 154, 255, 0.1) 0%, transparent 50%),
                     radial-gradient(ellipse at bottom right, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                     radial-gradient(ellipse at bottom left, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
          animation: aurora 20s ease-in-out infinite;
          pointer-events: none;
          z-index: -1;
      }

      @keyframes aurora {
          0%, 100% { opacity: 0.3; transform: scale(1) rotate(0deg); }
          33% { opacity: 0.5; transform: scale(1.1) rotate(1deg); }
          66% { opacity: 0.4; transform: scale(0.9) rotate(-1deg); }
      }

      .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(10px);
      }

      .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: var(--gradient-aurora);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: var(--shadow-card);
      }

      .header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
      }

      .fox-avatar {
          font-size: 2rem;
          animation: foxBounce 3s ease-in-out infinite;
      }

      @keyframes foxBounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
      }

      .header-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .header-actions {
          display: flex;
          gap: 0.5rem;
      }

      .header-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 0.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
      }

      .header-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
      }

      .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: var(--bg-chat);
      }

      .chat-messages::-webkit-scrollbar {
          width: 6px;
      }

      .chat-messages::-webkit-scrollbar-track {
          background: var(--bg-secondary);
      }

      .chat-messages::-webkit-scrollbar-thumb {
          background: var(--aurora-blue);
          border-radius: 3px;
      }

      .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: var(--text-secondary);
          gap: 1rem;
      }

      .empty-fox {
          font-size: 4rem;
          animation: foxBounce 3s ease-in-out infinite;
      }

      .empty-title {
          font-size: 1.5rem;
          font-weight: 600;
          background: var(--gradient-aurora);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
      }

      .empty-subtitle {
          font-size: 1rem;
          color: var(--text-muted);
          max-width: 300px;
      }

      .hidden {
          display: none !important;
      }

      /* Settings Panel Styles */
      .settings-panel {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
      }

      .settings-content {
          background: var(--bg-secondary);
          border-radius: 1rem;
          box-shadow: var(--shadow-card);
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow: hidden;
          animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
      }

      .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          background: var(--gradient-aurora);
          color: white;
      }

      .settings-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
      }

      .close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
      }

      .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
      }

      .settings-body {
          padding: 1.5rem;
          max-height: 60vh;
          overflow-y: auto;
      }

      .settings-body::-webkit-scrollbar {
          width: 6px;
      }

      .settings-body::-webkit-scrollbar-track {
          background: var(--bg-tertiary);
      }

      .settings-body::-webkit-scrollbar-thumb {
          background: var(--aurora-blue);
          border-radius: 3px;
      }

      .settings-section {
          margin-bottom: 2rem;
      }

      .settings-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
      }

      .api-keys-grid {
          display: grid;
          gap: 1rem;
      }

      .api-key-item {
          background: var(--bg-tertiary);
          border-radius: 0.5rem;
          padding: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .api-key-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
      }

      .api-key-name {
          font-weight: 500;
          color: var(--text-primary);
      }

      .api-key-status {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
      }

      .api-key-status.configured {
          background: rgba(16, 185, 129, 0.2);
          color: var(--aurora-green);
      }

      .api-key-status.missing {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
      }

      .api-key-input {
          width: 100%;
          background: var(--bg-primary);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.5rem;
          padding: 0.75rem;
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
      }

      .api-key-input:focus {
          outline: none;
          border-color: var(--aurora-blue);
          box-shadow: 0 0 0 2px rgba(76, 154, 255, 0.2);
      }

      .api-key-input::placeholder {
          color: var(--text-muted);
      }

      .provider-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
      }

      .provider-option {
          background: var(--bg-tertiary);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
      }

      .provider-option:hover {
          border-color: var(--aurora-blue);
          transform: translateY(-2px);
      }

      .provider-option.active {
          border-color: var(--aurora-blue);
          background: rgba(76, 154, 255, 0.1);
      }

      .provider-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
      }

      .provider-name {
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
      }

      .provider-description {
          font-size: 0.75rem;
          color: var(--text-muted);
      }

      .commands-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
      }

      .command-btn {
          background: var(--bg-tertiary);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-primary);
      }

      .command-btn:hover {
          border-color: var(--aurora-blue);
          transform: translateY(-2px);
          box-shadow: var(--shadow-glow);
      }

      .command-icon {
          font-size: 1.5rem;
      }

      .command-text {
          font-size: 0.875rem;
          font-weight: 500;
      }

      .profile-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--bg-tertiary);
          border-radius: 0.75rem;
          padding: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .profile-avatar {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          background: var(--gradient-fox);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
      }

      .profile-details {
          flex: 1;
      }

      .profile-name {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
      }

      .profile-role {
          font-size: 0.875rem;
          color: var(--text-muted);
      }
    </style>`;
  }

  /**
   * 🚀 Get JavaScript functionality for the webview
   */
  getWebviewJS() {
    return `
      // 🦊 Nox Chat Panel JavaScript
      class NoxChatUI {
          constructor() {
              this.vscode = acquireVsCodeApi();
              this.isAIResponding = false;

              this.initializeElements();
              this.setupEventListeners();

              // Request initial data
              this.sendMessage({ type: 'ready' });

              console.log('🦊 Nox Chat UI initialized');
          }

          initializeElements() {
              this.elements = {
                  messagesContainer: document.getElementById('chatMessages'),
                  chatInput: document.getElementById('chatInput'),
                  sendBtn: document.getElementById('sendBtn'),
                  thinkingIndicator: document.getElementById('thinkingIndicator'),
                  currentProviderSpan: document.getElementById('currentProvider'),
                  clearBtn: document.getElementById('clearBtn'),
                  emptyState: document.getElementById('emptyState'),
                  settingsBtn: document.getElementById('settingsBtn'),
                  settingsPanel: document.getElementById('settingsPanel'),
                  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
                  apiKeysGrid: document.getElementById('apiKeysGrid'),
                  providerGrid: document.getElementById('providerGrid')
              };
          }

          setupEventListeners() {
              // Send button
              this.elements.sendBtn.addEventListener('click', () => this.sendUserMessage());

              // Message input
              this.elements.chatInput.addEventListener('input', () => this.handleInputChange());
              this.elements.chatInput.addEventListener('keydown', (e) => this.handleKeyDown(e));

              // Header buttons
              this.elements.clearBtn.addEventListener('click', () => this.clearHistory());
              this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
              this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());

              // Settings panel backdrop click
              this.elements.settingsPanel.addEventListener('click', (e) => {
                  if (e.target === this.elements.settingsPanel) {
                      this.closeSettings();
                  }
              });

              // Listen for messages from extension
              window.addEventListener('message', (event) => this.handleExtensionMessage(event));
          }

          handleExtensionMessage(event) {
              const message = event.data;

              switch (message.type) {
                  case 'chatHistory':
                      this.loadChatHistory(message.history);
                      break;
                  case 'providerInfo':
                      this.updateProviderInfo(message.currentProvider, message.providers);
                      break;
                  case 'userMessage':
                      this.addMessage(message.message);
                      break;
                  case 'aiMessage':
                      this.addMessage(message.message);
                      break;
                  case 'aiThinking':
                      this.toggleThinking(message.thinking);
                      break;
                  case 'error':
                      this.showError(message.content);
                      break;
                  case 'historyCleared':
                      this.clearMessages();
                      break;
                  case 'apiKeyStatus':
                      this.updateApiKeyStatus(message.status);
                      break;
                  case 'providerSwitched':
                      this.updateProviderInfo(message.currentProvider, message.providers);
                      break;
                  case 'commandExecuted':
                      this.showCommandResult(message.result);
                      break;
                  default:
                      console.warn('Unknown message type:', message.type);
              }
          }

          updateApiKeyStatus(status) {
              Object.entries(status).forEach(([provider, hasKey]) => {
                  const statusElement = document.getElementById(\`status-\${provider}\`);
                  if (statusElement) {
                      if (hasKey) {
                          statusElement.textContent = 'Configured';
                          statusElement.className = 'api-key-status configured';
                      } else {
                          statusElement.textContent = 'Not Configured';
                          statusElement.className = 'api-key-status missing';
                      }
                  }
              });
          }

          showCommandResult(result) {
              if (result.success) {
                  this.addSystemMessage(\`✅ \${result.command} executed successfully!\`);
                  console.log('Command executed successfully:', result);
              } else {
                  this.addSystemMessage(\`❌ Command failed: \${result.error || 'Unknown error'}\`);
                  this.showError(result.error || 'Command execution failed');
              }
          }

          addSystemMessage(content) {
              const systemMessage = {
                  id: Date.now().toString(),
                  type: 'system',
                  content: content,
                  timestamp: new Date().toISOString()
              };

              this.addMessage(systemMessage);
          }

          sendMessage(message) {
              this.vscode.postMessage(message);
          }

          sendUserMessage() {
              const message = this.elements.chatInput.value.trim();

              if (!message || this.isAIResponding) {
                  return;
              }

              // Send to extension
              this.sendMessage({
                  type: 'sendMessage',
                  content: message
              });

              // Clear input
              this.elements.chatInput.value = '';
              this.handleInputChange();

              // Set responding state
              this.isAIResponding = true;
              this.updateSendButton();
          }

          handleInputChange() {
              const message = this.elements.chatInput.value.trim();
              this.elements.sendBtn.disabled = !message || this.isAIResponding;
          }

          handleKeyDown(e) {
              // Ctrl+Enter to send
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  this.sendUserMessage();
              }
          }

          updateSendButton() {
              const message = this.elements.chatInput.value.trim();
              this.elements.sendBtn.disabled = !message || this.isAIResponding;
          }

          loadChatHistory(history) {
              this.clearMessages();

              if (history.length === 0) {
                  this.showEmptyState();
                  return;
              }

              history.forEach(message => this.addMessage(message));
              this.scrollToBottom();
          }

          addMessage(message) {
              // Hide empty state if visible
              if (this.elements.emptyState) {
                  this.elements.emptyState.style.display = 'none';
              }

              const messageElement = this.createMessageElement(message);
              this.elements.messagesContainer.appendChild(messageElement);
              this.scrollToBottom();

              // Update responding state
              if (message.type === 'assistant') {
                  this.isAIResponding = false;
                  this.updateSendButton();
              }
          }

          createMessageElement(message) {
              const messageDiv = document.createElement('div');
              messageDiv.className = \`message \${message.type}\`;
              messageDiv.style.cssText = \`
                  display: flex;
                  gap: 0.75rem;
                  max-width: 85%;
                  animation: messageSlideIn 0.3s ease-out;
                  \${message.type === 'user' ? 'align-self: flex-end; flex-direction: row-reverse;' : 'align-self: flex-start;'}
              \`;

              const avatar = document.createElement('div');
              avatar.style.cssText = \`
                  width: 2.5rem;
                  height: 2.5rem;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 1.25rem;
                  flex-shrink: 0;
                  \${message.type === 'user' ?
                      'background: var(--gradient-aurora); color: white;' :
                      message.type === 'system' ?
                      'background: var(--aurora-cyan); color: white;' :
                      'background: var(--gradient-fox); color: white;'}
              \`;
              avatar.textContent = message.type === 'user' ? '👤' : message.type === 'system' ? '⚙️' : '🦊';

              const content = document.createElement('div');
              content.style.cssText = \`
                  \${message.type === 'user' ?
                      'background: linear-gradient(135deg, var(--aurora-blue), var(--aurora-purple)); color: white;' :
                      message.type === 'system' ?
                      'background: linear-gradient(135deg, var(--aurora-cyan), var(--aurora-blue)); color: white;' :
                      'background: var(--gradient-message);'}
                  padding: 0.75rem 1rem;
                  border-radius: 1rem;
                  box-shadow: var(--shadow-message);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  position: relative;
                  max-width: 100%;
                  word-wrap: break-word;
              \`;

              const text = document.createElement('div');
              text.style.cssText = 'line-height: 1.5; white-space: pre-wrap;';
              text.textContent = message.content;

              const meta = document.createElement('div');
              meta.style.cssText = \`
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  margin-top: 0.5rem;
                  font-size: 0.75rem;
                  color: var(--text-muted);
              \`;

              const timestamp = new Date(message.timestamp).toLocaleTimeString();
              meta.innerHTML = \`
                  <span>\${timestamp}</span>
                  \${message.provider ? \`<span>•</span><span>\${message.provider}</span>\` : ''}
                  \${message.tokens?.total_tokens ? \`<span>•</span><span>\${message.tokens.total_tokens} tokens</span>\` : ''}
              \`;

              content.appendChild(text);
              content.appendChild(meta);

              messageDiv.appendChild(avatar);
              messageDiv.appendChild(content);

              return messageDiv;
          }

          toggleThinking(thinking) {
              if (thinking) {
                  this.elements.thinkingIndicator.classList.remove('hidden');
                  this.scrollToBottom();
              } else {
                  this.elements.thinkingIndicator.classList.add('hidden');
              }
          }

          updateProviderInfo(currentProvider, providers) {
              this.currentProvider = currentProvider;
              this.providers = providers;

              if (currentProvider && providers[currentProvider]) {
                  const provider = providers[currentProvider];
                  this.elements.currentProviderSpan.textContent = provider.name;
              } else {
                  this.elements.currentProviderSpan.textContent = 'Loading...';
              }

              // Update settings panel if open
              this.updateSettingsProviders();
          }

          openSettings() {
              this.elements.settingsPanel.classList.remove('hidden');
              this.populateApiKeys();
              this.updateSettingsProviders();
          }

          closeSettings() {
              this.elements.settingsPanel.classList.add('hidden');
          }

          populateApiKeys() {
              const apiProviders = [
                  { key: 'anthropic', name: '🤖 Anthropic Claude', placeholder: 'sk-ant-api03-...' },
                  { key: 'openai', name: '🧠 OpenAI GPT-4', placeholder: 'sk-...' },
                  { key: 'deepseek', name: '🔍 DeepSeek', placeholder: 'sk-...' },
                  { key: 'local', name: '🏠 Local LLM', placeholder: 'http://localhost:11434' }
              ];

              this.elements.apiKeysGrid.innerHTML = apiProviders.map(provider => \`
                  <div class="api-key-item">
                      <div class="api-key-header">
                          <span class="api-key-name">\${provider.name}</span>
                          <span class="api-key-status missing" id="status-\${provider.key}">Not Configured</span>
                      </div>
                      <input
                          type="password"
                          class="api-key-input"
                          id="apikey-\${provider.key}"
                          placeholder="\${provider.placeholder}"
                          data-provider="\${provider.key}"
                      >
                  </div>
              \`).join('');

              // Add event listeners for API key inputs
              apiProviders.forEach(provider => {
                  const input = document.getElementById(\`apikey-\${provider.key}\`);
                  const status = document.getElementById(\`status-\${provider.key}\`);

                  input.addEventListener('change', async () => {
                      const value = input.value.trim();
                      if (value) {
                          this.sendMessage({
                              type: 'setApiKey',
                              provider: provider.key,
                              apiKey: value
                          });
                          status.textContent = 'Configured';
                          status.className = 'api-key-status configured';
                      } else {
                          this.sendMessage({
                              type: 'removeApiKey',
                              provider: provider.key
                          });
                          status.textContent = 'Not Configured';
                          status.className = 'api-key-status missing';
                      }
                  });
              });

              // Request current API key status
              this.sendMessage({ type: 'getApiKeyStatus' });
          }

          updateSettingsProviders() {
              if (!this.providers) return;

              const providerOptions = Object.entries(this.providers).map(([key, provider]) => \`
                  <div class="provider-option \${key === this.currentProvider ? 'active' : ''}"
                       data-provider="\${key}">
                      <div class="provider-icon">\${provider.icon || '🤖'}</div>
                      <div class="provider-name">\${provider.name}</div>
                      <div class="provider-description">\${provider.description || ''}</div>
                  </div>
              \`).join('');

              this.elements.providerGrid.innerHTML = providerOptions;

              // Add click listeners for provider selection
              this.elements.providerGrid.querySelectorAll('.provider-option').forEach(option => {
                  option.addEventListener('click', () => {
                      const provider = option.dataset.provider;

                      // Update UI immediately for better UX
                      this.elements.providerGrid.querySelectorAll('.provider-option').forEach(opt => {
                          opt.classList.remove('active');
                      });
                      option.classList.add('active');

                      // Update the current provider display
                      this.currentProvider = provider;
                      if (this.providers[provider]) {
                          this.elements.currentProviderSpan.textContent = this.providers[provider].name;
                      }

                      // Send to backend
                      this.sendMessage({
                          type: 'switchProvider',
                          provider: provider
                      });

                      console.log('🦊 Switched to provider:', provider);
                  });
              });

              // Add command button listeners
              document.querySelectorAll('.command-btn').forEach(btn => {
                  btn.addEventListener('click', () => {
                      const command = btn.dataset.command;
                      const commandText = btn.querySelector('.command-text').textContent;

                      // Visual feedback
                      btn.style.transform = 'scale(0.95)';
                      setTimeout(() => {
                          btn.style.transform = '';
                      }, 150);

                      // Send command
                      this.sendMessage({
                          type: 'executeCommand',
                          command: command
                      });

                      // Show feedback message
                      this.addSystemMessage(\`🦊 Executing: \${commandText}...\`);

                      this.closeSettings();
                      console.log('🦊 Executing command:', command);
                  });
              });
          }

          showEmptyState() {
              if (this.elements.emptyState) {
                  this.elements.emptyState.style.display = 'flex';
              }
          }

          clearMessages() {
              // Remove all messages except empty state
              const messages = this.elements.messagesContainer.querySelectorAll('.message');
              messages.forEach(msg => msg.remove());

              this.showEmptyState();
          }

          scrollToBottom() {
              setTimeout(() => {
                  this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
              }, 100);
          }

          clearHistory() {
              if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
                  this.sendMessage({ type: 'clearHistory' });
              }
          }

          showError(message) {
              alert('Error: ' + message);
          }
      }

      // Add missing CSS for animations
      const style = document.createElement('style');
      style.textContent = \`
          @keyframes messageSlideIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
          }

          .message {
              display: flex;
              gap: 0.75rem;
              max-width: 85%;
              animation: messageSlideIn 0.3s ease-out;
          }

          .message.user {
              align-self: flex-end;
              flex-direction: row-reverse;
          }

          .message.assistant {
              align-self: flex-start;
          }

          .thinking-indicator {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1rem;
              animation: messageSlideIn 0.3s ease-out;
          }

          .thinking-content {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              background: var(--gradient-message);
              padding: 0.75rem 1rem;
              border-radius: 1rem;
              box-shadow: var(--shadow-message);
              border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .thinking-dots {
              display: flex;
              gap: 0.25rem;
          }

          .thinking-dots span {
              width: 0.5rem;
              height: 0.5rem;
              background: var(--aurora-blue);
              border-radius: 50%;
              animation: thinkingPulse 1.4s ease-in-out infinite;
          }

          .thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
          .thinking-dots span:nth-child(3) { animation-delay: 0.4s; }

          @keyframes thinkingPulse {
              0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
              40% { transform: scale(1); opacity: 1; }
          }

          .chat-input-container {
              background: var(--bg-secondary);
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              padding: 1rem;
          }

          .provider-info {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 0.75rem;
              color: var(--text-muted);
              margin-bottom: 0.5rem;
          }

          .provider-badge {
              background: var(--aurora-blue);
              color: white;
              padding: 0.25rem 0.5rem;
              border-radius: 0.5rem;
              font-size: 0.7rem;
              font-weight: 500;
          }

          .chat-input-wrapper {
              display: flex;
              gap: 0.75rem;
              align-items: flex-end;
              background: var(--bg-tertiary);
              border-radius: 1rem;
              padding: 0.75rem;
              border: 1px solid rgba(255, 255, 255, 0.1);
              box-shadow: var(--shadow-card);
          }

          .chat-input {
              flex: 1;
              background: transparent;
              border: none;
              color: var(--text-primary);
              font-size: 1rem;
              resize: none;
              outline: none;
              min-height: 1.5rem;
              max-height: 8rem;
              line-height: 1.5;
              font-family: inherit;
          }

          .chat-input::placeholder {
              color: var(--text-muted);
          }

          .send-btn {
              background: var(--gradient-aurora);
              border: none;
              color: white;
              padding: 0.75rem;
              border-radius: 0.75rem;
              cursor: pointer;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              min-width: 3rem;
              box-shadow: var(--shadow-glow);
          }

          .send-btn:hover:not(:disabled) {
              transform: translateY(-1px);
              box-shadow: 0 0 25px rgba(76, 154, 255, 0.4);
          }

          .send-btn:disabled {
              opacity: 0.5;
              cursor: not-allowed;
          }
      \`;
      document.head.appendChild(style);

      // Initialize the chat UI when DOM is loaded
      if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => new NoxChatUI());
      } else {
          new NoxChatUI();
      }
    `;
  }

  /**
   * 🔐 Generate a nonce for Content Security Policy
   */
  getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}

// Static reference to current panel
ChatPanel.currentPanel = null;

module.exports = ChatPanel;
