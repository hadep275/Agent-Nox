const vscode = require("vscode");

/**
 * 🦊 Nox Chat Panel - Custom Webview Interface
 * Aurora-themed chat interface with fox mascot and enterprise features
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
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, "src", "webview"),
          vscode.Uri.joinPath(context.extensionUri, "assets"),
        ],
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
            case "exportHistory":
              await this.exportChatHistory();
              break;
            case "openSettings":
              await this.openSettings();
              break;
            case "switchProvider":
              await this.switchAIProvider(message.provider);
              break;
            case "ready":
              await this.sendInitialData();
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

    this.panel.onDidChangeViewState(
      (e) => {
        if (e.webviewPanel.visible) {
          this.logger.info("🦊 Chat panel became visible");
        }
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
      this.sendMessageToWebview({
        type: "error",
        content: "Please wait for the current response to complete.",
      });
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
        {
          maxTokens: 4000,
        }
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
   * 📁 Export chat history
   */
  async exportChatHistory() {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        chatHistory: this.chatHistory,
        metadata: {
          extension: "Nox AI Coding Fox",
          version: "0.1.0",
        },
      };

      const exportJson = JSON.stringify(exportData, null, 2);

      // Show save dialog
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`nox-chat-export-${Date.now()}.json`),
        filters: {
          "JSON files": ["json"],
          "All files": ["*"],
        },
      });

      if (uri) {
        await vscode.workspace.fs.writeFile(
          uri,
          Buffer.from(exportJson, "utf8")
        );

        vscode.window.showInformationMessage(
          `🦊 Chat history exported to ${uri.fsPath}`
        );
      }
    } catch (error) {
      this.logger.error("Error exporting chat history:", error);
      vscode.window.showErrorMessage(
        `Failed to export chat history: ${error.message}`
      );
    }
  }

  /**
   * ⚙️ Open settings panel
   */
  async openSettings() {
    // For now, delegate to existing API key command
    await vscode.commands.executeCommand("nox.apiKeys");
  }

  /**
   * 🔄 Switch AI provider
   */
  async switchAIProvider(provider) {
    try {
      await this.agentController.aiClient.setProvider(provider);

      this.sendMessageToWebview({
        type: "providerSwitched",
        provider,
      });

      this.logger.info(`🦊 Switched to AI provider: ${provider}`);
    } catch (error) {
      this.logger.error(`Error switching to provider ${provider}:`, error);
      this.sendErrorToWebview(error.message);
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
    // This will be implemented in the next step
    return this.getWebviewHTML();
  }

  /**
   * 📄 Generate the HTML content for the webview
   */
  getWebviewHTML() {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <title>🦊 Nox Chat</title>
        <style nonce="${nonce}">
            ${this.getWebviewCSS()}
        </style>
    </head>
    <body>
        <div id="app">
            <!-- Header -->
            <header class="chat-header">
                <div class="header-content">
                    <div class="fox-avatar">
                        <span class="fox-emoji">🦊</span>
                        <div class="aurora-glow"></div>
                    </div>
                    <div class="header-info">
                        <h1 class="chat-title">Nox</h1>
                        <div class="provider-info">
                            <span id="current-provider">Loading...</span>
                            <button id="settings-btn" class="icon-btn" title="Settings">⚙️</button>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button id="clear-btn" class="icon-btn" title="Clear History">🗑️</button>
                        <button id="export-btn" class="icon-btn" title="Export History">📁</button>
                    </div>
                </div>
            </header>

            <!-- Chat Messages -->
            <main class="chat-container">
                <div id="messages" class="messages-container">
                    <div class="welcome-message">
                        <div class="fox-welcome">
                            <span class="fox-large">🦊</span>
                            <div class="welcome-text">
                                <h2>Welcome to Nox!</h2>
                                <p>Your clever AI coding fox is ready to help. Ask me anything about your code!</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AI Thinking Indicator -->
                <div id="thinking-indicator" class="thinking-indicator hidden">
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
            </main>

            <!-- Input Area -->
            <footer class="chat-input">
                <div class="input-container">
                    <textarea
                        id="message-input"
                        placeholder="Ask Nox anything about your code..."
                        rows="1"
                        maxlength="4000"
                    ></textarea>
                    <button id="send-btn" class="send-button" disabled>
                        <span class="send-icon">🚀</span>
                    </button>
                </div>
                <div class="input-footer">
                    <span class="char-count">0/4000</span>
                    <span class="tip">Press Ctrl+Enter to send</span>
                </div>
            </footer>

            <!-- Provider Selector Modal -->
            <div id="provider-modal" class="modal hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🔄 Switch AI Provider</h3>
                        <button id="close-modal" class="close-btn">✕</button>
                    </div>
                    <div class="modal-body">
                        <div id="provider-list" class="provider-list">
                            <!-- Providers will be populated by JavaScript -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error Toast -->
            <div id="error-toast" class="error-toast hidden">
                <span class="error-icon">⚠️</span>
                <span id="error-message"></span>
                <button id="close-error" class="close-btn">✕</button>
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
    return `
      /* 🦊 Nox Aurora Theme CSS */
      :root {
          /* Aurora Colors */
          --aurora-blue: #4c9aff;
          --aurora-purple: #8b5cf6;
          --aurora-green: #10b981;
          --aurora-pink: #f472b6;
          --aurora-cyan: #06b6d4;
          --aurora-orange: #ff6b35;

          /* Dark Theme */
          --bg-primary: #0a0a0f;
          --bg-secondary: #1a1a2e;
          --bg-tertiary: #16213e;
          --bg-chat: #0f1419;
          --text-primary: #ffffff;
          --text-secondary: #a0a9c0;
          --text-muted: #6b7280;

          /* Gradients */
          --gradient-aurora: linear-gradient(135deg, var(--aurora-blue), var(--aurora-purple), var(--aurora-green));
          --gradient-fox: linear-gradient(135deg, var(--aurora-orange), #f7931e, #ffcd3c);
          --gradient-message: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));

          /* Shadows */
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

      /* Aurora Background Animation */
      body::before {
          content: '';
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

      /* Main Layout */
      #app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(10px);
      }

      /* Header */
      .chat-header {
          background: var(--gradient-aurora);
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: var(--shadow-card);
      }

      .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 100%;
      }

      .fox-avatar {
          position: relative;
          margin-right: 1rem;
      }

      .fox-emoji {
          font-size: 2.5rem;
          animation: foxBounce 3s ease-in-out infinite;
          display: block;
      }

      @keyframes foxBounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
      }

      .aurora-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 4rem;
          height: 4rem;
          background: radial-gradient(circle, rgba(76, 154, 255, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          animation: glowPulse 2s ease-in-out infinite;
          z-index: -1;
      }

      @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
      }

      .header-info {
          flex: 1;
      }

      .chat-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          margin-bottom: 0.25rem;
      }

      .provider-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
      }

      .header-actions {
          display: flex;
          gap: 0.5rem;
      }

      .icon-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 0.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
          font-size: 1rem;
      }

      .icon-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
      }

      /* Chat Container */
      .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg-chat);
      }

      .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
      }

      .messages-container::-webkit-scrollbar {
          width: 6px;
      }

      .messages-container::-webkit-scrollbar-track {
          background: var(--bg-secondary);
      }

      .messages-container::-webkit-scrollbar-thumb {
          background: var(--aurora-blue);
          border-radius: 3px;
      }

      /* Welcome Message */
      .welcome-message {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
      }

      .fox-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--text-secondary);
      }

      .fox-large {
          font-size: 4rem;
          animation: foxBounce 3s ease-in-out infinite;
      }

      .welcome-text h2 {
          font-size: 1.5rem;
          font-weight: 600;
          background: var(--gradient-aurora);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
      }

      .welcome-text p {
          color: var(--text-muted);
          max-width: 300px;
      }

      /* Message Bubbles */
      .message {
          display: flex;
          gap: 0.75rem;
          max-width: 85%;
          animation: messageSlideIn 0.3s ease-out;
      }

      @keyframes messageSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
      }

      .message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
      }

      .message.assistant {
          align-self: flex-start;
      }

      .message-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
      }

      .message.user .message-avatar {
          background: var(--gradient-aurora);
          color: white;
      }

      .message.assistant .message-avatar {
          background: var(--gradient-fox);
          color: white;
      }

      .message-content {
          background: var(--gradient-message);
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          box-shadow: var(--shadow-message);
          border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          max-width: 100%;
          word-wrap: break-word;
      }

      .message.user .message-content {
          background: linear-gradient(135deg, var(--aurora-blue), var(--aurora-purple));
          color: white;
      }

      .message-text {
          line-height: 1.5;
          white-space: pre-wrap;
      }

      .message-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
      }

      /* Thinking Indicator */
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

      .fox-thinking {
          font-size: 1.25rem;
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

      .thinking-text {
          color: var(--text-secondary);
          font-style: italic;
      }

      /* Input Area */
      .chat-input {
          background: var(--bg-secondary);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem;
      }

      .input-container {
          display: flex;
          gap: 0.75rem;
          align-items: flex-end;
          background: var(--bg-tertiary);
          border-radius: 1rem;
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: var(--shadow-card);
      }

      #message-input {
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

      #message-input::placeholder {
          color: var(--text-muted);
      }

      .send-button {
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

      .send-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 25px rgba(76, 154, 255, 0.4);
      }

      .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
      }

      .input-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
      }

      /* Hidden class */
      .hidden {
          display: none !important;
      }

      /* Error Toast */
      .error-toast {
          position: fixed;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          padding: 1rem;
          border-radius: 0.75rem;
          box-shadow: var(--shadow-card);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          max-width: 400px;
          z-index: 1000;
          animation: slideInRight 0.3s ease-out;
      }

      @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
      }

      .error-icon {
          font-size: 1.25rem;
      }

      .close-btn {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: background-color 0.2s ease;
      }

      .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
      }

      /* Modal */
      .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
      }

      .modal-content {
          background: var(--bg-secondary);
          border-radius: 1rem;
          box-shadow: var(--shadow-card);
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
      }

      .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: var(--gradient-aurora);
          color: white;
      }

      .modal-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
      }

      .modal-body {
          padding: 1rem;
      }

      .provider-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
      }

      .provider-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: var(--bg-tertiary);
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.2s ease;
      }

      .provider-option:hover {
          background: var(--bg-secondary);
          transform: translateY(-1px);
      }

      .provider-option.active {
          border-color: var(--aurora-blue);
          box-shadow: 0 0 0 2px rgba(76, 154, 255, 0.2);
      }

      .provider-info-left {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
      }

      .provider-name {
          font-weight: 600;
          color: var(--text-primary);
      }

      .provider-status {
          font-size: 0.875rem;
          color: var(--text-muted);
      }

      /* Responsive Design */
      @media (max-width: 768px) {
          .chat-header {
              padding: 0.75rem;
          }

          .header-content {
              flex-wrap: wrap;
              gap: 0.5rem;
          }

          .chat-title {
              font-size: 1.25rem;
          }

          .message {
              max-width: 95%;
          }

          .chat-input {
              padding: 0.75rem;
          }

          .fox-large {
              font-size: 3rem;
          }
      }
    `;
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
              this.currentProvider = null;
              this.providers = {};

              this.initializeElements();
              this.setupEventListeners();
              this.setupKeyboardShortcuts();

              // Request initial data
              this.sendMessage({ type: 'ready' });

              console.log('🦊 Nox Chat UI initialized');
          }

          initializeElements() {
              // Get DOM elements
              this.elements = {
                  messagesContainer: document.getElementById('messages'),
                  messageInput: document.getElementById('message-input'),
                  sendBtn: document.getElementById('send-btn'),
                  thinkingIndicator: document.getElementById('thinking-indicator'),
                  currentProviderSpan: document.getElementById('current-provider'),
                  settingsBtn: document.getElementById('settings-btn'),
                  clearBtn: document.getElementById('clear-btn'),
                  exportBtn: document.getElementById('export-btn'),
                  errorToast: document.getElementById('error-toast'),
                  errorMessage: document.getElementById('error-message'),
                  closeError: document.getElementById('close-error'),
                  charCount: document.querySelector('.char-count'),
                  welcomeMessage: document.querySelector('.welcome-message')
              };
          }

          setupEventListeners() {
              // Send button
              this.elements.sendBtn.addEventListener('click', () => this.sendUserMessage());

              // Message input
              this.elements.messageInput.addEventListener('input', () => this.handleInputChange());
              this.elements.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));

              // Header buttons
              this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
              this.elements.clearBtn.addEventListener('click', () => this.clearHistory());
              this.elements.exportBtn.addEventListener('click', () => this.exportHistory());

              // Error toast
              this.elements.closeError.addEventListener('click', () => this.hideError());

              // Provider info click
              this.elements.currentProviderSpan.addEventListener('click', () => this.showProviderSelector());

              // Auto-resize textarea
              this.elements.messageInput.addEventListener('input', () => this.autoResizeTextarea());

              // Listen for messages from extension
              window.addEventListener('message', (event) => this.handleExtensionMessage(event));
          }

          setupKeyboardShortcuts() {
              document.addEventListener('keydown', (e) => {
                  // Ctrl+Enter to send
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      this.sendUserMessage();
                  }

                  // Escape to clear input
                  if (e.key === 'Escape') {
                      this.elements.messageInput.value = '';
                      this.handleInputChange();
                  }
              });
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
                  case 'providerSwitched':
                      this.currentProvider = message.provider;
                      this.updateProviderDisplay();
                      break;
                  default:
                      console.warn('Unknown message type:', message.type);
              }
          }

          sendMessage(message) {
              this.vscode.postMessage(message);
          }

          sendUserMessage() {
              const message = this.elements.messageInput.value.trim();

              if (!message || this.isAIResponding) {
                  return;
              }

              // Send to extension
              this.sendMessage({
                  type: 'sendMessage',
                  content: message
              });

              // Clear input
              this.elements.messageInput.value = '';
              this.handleInputChange();
              this.autoResizeTextarea();

              // Set responding state
              this.isAIResponding = true;
              this.updateSendButton();
          }

          handleInputChange() {
              const message = this.elements.messageInput.value;
              const length = message.length;

              // Update character count
              this.elements.charCount.textContent = \`\${length}/4000\`;

              // Update send button state
              this.elements.sendBtn.disabled = length === 0 || this.isAIResponding;

              // Update character count color
              if (length > 3800) {
                  this.elements.charCount.style.color = 'var(--aurora-pink)';
              } else if (length > 3500) {
                  this.elements.charCount.style.color = 'var(--aurora-orange)';
              } else {
                  this.elements.charCount.style.color = 'var(--text-muted)';
              }
          }

          handleKeyDown(e) {
              // Ctrl+Enter to send
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  this.sendUserMessage();
              }
          }

          autoResizeTextarea() {
              const textarea = this.elements.messageInput;
              textarea.style.height = 'auto';
              textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
          }

          updateSendButton() {
              const message = this.elements.messageInput.value.trim();
              this.elements.sendBtn.disabled = !message || this.isAIResponding;
          }

          loadChatHistory(history) {
              this.clearMessages();

              if (history.length === 0) {
                  this.showWelcomeMessage();
                  return;
              }

              history.forEach(message => this.addMessage(message));
              this.scrollToBottom();
          }

          addMessage(message) {
              // Hide welcome message if visible
              if (this.elements.welcomeMessage) {
                  this.elements.welcomeMessage.style.display = 'none';
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

              const avatar = document.createElement('div');
              avatar.className = 'message-avatar';
              avatar.textContent = message.type === 'user' ? '👤' : '🦊';

              const content = document.createElement('div');
              content.className = 'message-content';

              const text = document.createElement('div');
              text.className = 'message-text';
              text.textContent = message.content;

              const meta = document.createElement('div');
              meta.className = 'message-meta';

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
              this.updateProviderDisplay();
          }

          updateProviderDisplay() {
              if (this.currentProvider && this.providers[this.currentProvider]) {
                  const provider = this.providers[this.currentProvider];
                  this.elements.currentProviderSpan.textContent = provider.name;
                  this.elements.currentProviderSpan.style.cursor = 'pointer';
                  this.elements.currentProviderSpan.title = 'Click to switch provider';
              } else {
                  this.elements.currentProviderSpan.textContent = 'Loading...';
              }
          }

          showWelcomeMessage() {
              if (this.elements.welcomeMessage) {
                  this.elements.welcomeMessage.style.display = 'flex';
              }
          }

          clearMessages() {
              // Remove all messages except welcome
              const messages = this.elements.messagesContainer.querySelectorAll('.message');
              messages.forEach(msg => msg.remove());

              this.showWelcomeMessage();
          }

          scrollToBottom() {
              setTimeout(() => {
                  this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
              }, 100);
          }

          openSettings() {
              this.sendMessage({ type: 'openSettings' });
          }

          clearHistory() {
              if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
                  this.sendMessage({ type: 'clearHistory' });
              }
          }

          exportHistory() {
              this.sendMessage({ type: 'exportHistory' });
          }

          showProviderSelector() {
              // For now, just open settings
              this.openSettings();
          }

          showError(message) {
              this.elements.errorMessage.textContent = message;
              this.elements.errorToast.classList.remove('hidden');

              // Auto-hide after 5 seconds
              setTimeout(() => this.hideError(), 5000);
          }

          hideError() {
              this.elements.errorToast.classList.add('hidden');
          }
      }

      // Initialize the chat UI when DOM is loaded
      if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => new NoxChatUI());
      } else {
          new NoxChatUI();
      }
    `;
  }

  /**
   * 🔐 Generate a nonce for CSP
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
