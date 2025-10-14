const vscode = require("vscode");

/**
 * 🦊 Nox Chat Sidebar - WebviewViewProvider for Sidebar Integration
 * Aurora-themed chat interface embedded in VS Code sidebar (like Augment chat)
 */
class NoxChatViewProvider {
  constructor(context, agentController, logger) {
    this.context = context;
    this.agentController = agentController;
    this.logger = logger;
    this.webviewView = null;
    this.disposables = [];
    this.chatHistory = [];
    this.isAIResponding = false;
  }

  /**
   * 🎨 WebviewViewProvider interface - called when view is first shown
   */
  resolveWebviewView(webviewView, context, token) {
    this.webviewView = webviewView;

    // Configure webview
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    // Set initial content
    webviewView.webview.html = this.getWebviewContent();

    // Setup message handling
    this.setupMessageHandling();

    // Load chat history
    this.loadChatHistory();

    // Setup view events
    this.setupViewEvents();

    this.logger.info("🦊 Nox chat sidebar initialized successfully");
  }

  /**
   * 🔧 Setup message handling between webview and extension
   */
  setupMessageHandling() {
    this.webviewView.webview.onDidReceiveMessage(
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
              await this.handleWebviewReady();
              break;

            case "openSettings":
              await vscode.commands.executeCommand("nox.settings");
              break;

            case "changeProvider":
              await this.handleProviderChange(message.provider);
              break;

            case "changeModel":
              await this.handleModelChange(message.model);
              break;

            case "getProviderStatus":
              await this.sendProviderStatus();
              break;

            default:
              this.logger.warn(`Unknown message type: ${message.type}`);
          }
        } catch (error) {
          this.logger.error("Error handling webview message:", error);
          this.sendErrorToWebview(error.message);
        }
      },
      undefined,
      this.disposables
    );
  }

  /**
   * 🤖 Handle user message and get AI response
   */
  async handleUserMessage(userMessage) {
    if (!userMessage?.trim()) {
      return;
    }

    if (this.isAIResponding) {
      this.sendMessageToWebview({
        type: "error",
        message: "Please wait for the current response to complete.",
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
        { maxTokens: 4000 }
      );

      // Hide thinking indicator
      this.sendMessageToWebview({
        type: "aiThinking",
        thinking: false,
      });

      // Add AI response to history
      const aiMessageObj = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        tokens: aiResponse.tokens || 0,
        cost: aiResponse.cost || 0,
        provider: aiResponse.provider || "unknown",
        model: aiResponse.model || "unknown",
      };

      this.chatHistory.push(aiMessageObj);
      this.saveChatHistory();

      // Send AI response to webview
      this.sendMessageToWebview({
        type: "aiMessage",
        message: aiMessageObj,
      });

      this.logger.info(
        `🦊 Chat exchange completed (${
          aiResponse.usage?.total_tokens || 0
        } tokens)`
      );
    } catch (error) {
      this.logger.error("Error in chat exchange:", error);
      this.sendErrorToWebview(error.message);
    } finally {
      this.isAIResponding = false;
    }
  }

  /**
   * 📨 Send message to webview
   */
  sendMessageToWebview(message) {
    if (this.webviewView) {
      this.webviewView.webview.postMessage(message);
    }
  }

  /**
   * ❌ Send error message to webview
   */
  sendErrorToWebview(errorMessage) {
    this.sendMessageToWebview({
      type: "error",
      message: errorMessage,
    });

    // Hide thinking indicator on error
    this.sendMessageToWebview({
      type: "aiThinking",
      thinking: false,
    });
  }

  /**
   * 🗑️ Clear chat history
   */
  async clearChatHistory() {
    this.chatHistory = [];
    await this.saveChatHistory();
    this.sendMessageToWebview({ type: "clearMessages" });
    this.logger.info("🦊 Chat history cleared");
  }

  /**
   * 🔄 Handle provider change
   */
  async handleProviderChange(provider) {
    try {
      if (!this.agentController?.aiClient) {
        throw new Error("AI Client not available");
      }

      // Update current provider
      await this.agentController.aiClient.setCurrentProvider(provider);

      // Send updated provider info to webview
      await this.sendProviderStatus();

      this.logger.info(`🦊 Provider changed to: ${provider}`);
    } catch (error) {
      this.logger.error("Failed to change provider:", error);
      this.sendErrorToWebview(`Failed to change provider: ${error.message}`);
    }
  }

  /**
   * 🔄 Handle model change
   */
  async handleModelChange(model) {
    try {
      if (!this.agentController?.aiClient) {
        throw new Error("AI Client not available");
      }

      // Update current model (we'll need to add this method to aiClient)
      await this.agentController.aiClient.setCurrentModel(model);

      // Send updated provider info to webview
      await this.sendProviderStatus();

      this.logger.info(`🦊 Model changed to: ${model}`);
    } catch (error) {
      this.logger.error("Failed to change model:", error);
      this.sendErrorToWebview(`Failed to change model: ${error.message}`);
    }
  }

  /**
   * 📊 Send provider status to webview
   */
  async sendProviderStatus() {
    try {
      if (!this.agentController?.aiClient) {
        return;
      }

      const currentProvider =
        this.agentController.aiClient.getCurrentProvider();
      const providers = this.agentController.aiClient.getProviders();
      const currentModel = this.agentController.aiClient.getCurrentModel();

      // Get API key status for each provider
      const providerStatus = {};
      for (const [providerId, provider] of Object.entries(providers)) {
        const hasApiKey = await this.agentController.aiClient.getApiKey(
          providerId
        );
        providerStatus[providerId] = {
          ...provider,
          hasApiKey: !!hasApiKey,
          isActive: providerId === currentProvider,
        };
      }

      this.sendMessageToWebview({
        type: "providerStatus",
        currentProvider,
        currentModel,
        providers: providerStatus,
      });
    } catch (error) {
      this.logger.error("Failed to send provider status:", error);
    }
  }

  /**
   * 💾 Save chat history to workspace state
   */
  async saveChatHistory() {
    try {
      await this.context.workspaceState.update(
        "nox.chatHistory",
        this.chatHistory
      );
    } catch (error) {
      this.logger.error("Failed to save chat history:", error);
    }
  }

  /**
   * 📖 Load chat history from workspace state
   */
  async loadChatHistory() {
    try {
      const savedHistory = this.context.workspaceState.get(
        "nox.chatHistory",
        []
      );
      this.chatHistory = Array.isArray(savedHistory) ? savedHistory : [];

      if (this.chatHistory.length > 0) {
        this.sendMessageToWebview({
          type: "loadHistory",
          history: this.chatHistory,
        });
      }
    } catch (error) {
      this.logger.error("Failed to load chat history:", error);
      this.chatHistory = [];
    }
  }

  /**
   * 🚀 Handle webview ready event
   */
  async handleWebviewReady() {
    // Send current provider info
    const currentProvider = this.agentController.aiClient.getCurrentProvider();
    this.sendMessageToWebview({
      type: "providerInfo",
      provider: currentProvider,
    });

    // Load chat history
    await this.loadChatHistory();
  }

  /**
   * 🔧 Setup view-specific events
   */
  setupViewEvents() {
    // Handle view visibility changes
    this.webviewView.onDidChangeVisibility(() => {
      if (this.webviewView.visible) {
        this.logger.info("🦊 Nox chat sidebar became visible");
      }
    });

    // Handle view disposal
    this.webviewView.onDidDispose(() => {
      this.dispose();
    });
  }

  /**
   * 🧹 Cleanup resources
   */
  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.webviewView = null;
    this.logger.info("🦊 Nox chat sidebar disposed");
  }

  /**
   * 🎨 Get webview HTML content (reusing existing design)
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

            <!-- Provider & Model Selection -->
            <div class="provider-controls">
                <div class="provider-selector">
                    <label for="providerSelect">🤖 Provider:</label>
                    <select id="providerSelect" class="provider-dropdown">
                        <option value="anthropic">🤖 Anthropic Claude</option>
                        <option value="openai">🧠 OpenAI GPT</option>
                        <option value="deepseek">⚡ DeepSeek</option>
                        <option value="local">🏠 Local LLM</option>
                    </select>
                    <div class="provider-status" id="providerStatus">
                        <span class="status-indicator" id="statusIndicator">●</span>
                        <span class="status-text" id="statusText">Ready</span>
                    </div>
                </div>

                <div class="model-selector">
                    <label for="modelSelect">🧠 Model:</label>
                    <select id="modelSelect" class="model-dropdown">
                        <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
                    </select>
                </div>

                <div class="cost-tracker" id="costTracker">
                    <div class="cost-info">
                        <span class="cost-label">Session:</span>
                        <span class="cost-value" id="sessionCost">$0.00</span>
                    </div>
                    <div class="token-info">
                        <span class="token-label">Tokens:</span>
                        <span class="token-value" id="sessionTokens">0</span>
                    </div>
                </div>
            </div>

            <!-- Messages Container -->
            <div class="messages-container" id="messagesContainer">
                <div class="welcome-message">
                    <div class="fox-welcome">🦊</div>
                    <div class="welcome-text">
                        <h3>Welcome to Nox!</h3>
                        <p>Your clever AI coding fox is ready to help.</p>
                    </div>
                </div>
            </div>

            <!-- AI Thinking Indicator -->
            <div class="thinking-indicator" id="thinkingIndicator" style="display: none;">
                <div class="thinking-content">
                    <span class="fox-thinking">🦊</span>
                    <div class="thinking-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <span class="thinking-text">Thinking...</span>
                </div>
            </div>

            <!-- Input Area -->
            <div class="input-container">
                <div class="input-wrapper">
                    <textarea id="messageInput" placeholder="Ask Nox anything about your code..." rows="1"></textarea>
                    <button id="sendBtn" class="send-btn" title="Send message">
                        <span class="send-icon">🚀</span>
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
   * 🎨 Generate a nonce for CSP
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

  /**
   * 🎨 Get Aurora-themed CSS for sidebar (optimized for narrow width)
   */
  getWebviewCSS() {
    return `<style>
      /* Aurora Theme Variables */
      :root {
        --aurora-blue: #4c9aff;
        --aurora-purple: #8b5cf6;
        --aurora-green: #10b981;
        --aurora-pink: #f472b6;
        --aurora-cyan: #06b6d4;
        --aurora-orange: #ff6b35;
        --bg-primary: var(--vscode-sideBar-background);
        --bg-secondary: var(--vscode-sideBarSectionHeader-background);
        --text-primary: var(--vscode-sideBar-foreground);
        --text-secondary: var(--vscode-descriptionForeground);
        --border-color: var(--vscode-sideBarSectionHeader-border);
        --input-bg: var(--vscode-input-background);
        --input-border: var(--vscode-input-border);
        --button-bg: var(--aurora-blue);
        --button-hover: var(--aurora-purple);
      }

      /* Reset and Base */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        background: var(--bg-primary);
        color: var(--text-primary);
        height: 100vh;
        overflow: hidden;
      }

      /* Aurora Background */
      .aurora-bg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg,
          rgba(76, 154, 255, 0.1) 0%,
          rgba(139, 92, 246, 0.1) 25%,
          rgba(16, 185, 129, 0.1) 50%,
          rgba(244, 114, 182, 0.1) 75%,
          rgba(6, 182, 212, 0.1) 100%);
        background-size: 400% 400%;
        animation: aurora-flow 15s ease-in-out infinite;
        pointer-events: none;
        z-index: -1;
      }

      @keyframes aurora-flow {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      /* Main Container */
      .chat-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        position: relative;
      }

      /* Provider Controls */
      .provider-controls {
        background: rgba(15, 23, 42, 0.95);
        border-bottom: 1px solid var(--aurora-blue);
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        backdrop-filter: blur(10px);
      }

      .provider-selector, .model-selector {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }

      .provider-selector label, .model-selector label {
        color: var(--aurora-blue);
        font-weight: 600;
        min-width: 60px;
      }

      .provider-dropdown, .model-dropdown {
        flex: 1;
        background: rgba(30, 41, 59, 0.8);
        border: 1px solid var(--aurora-blue);
        border-radius: 6px;
        color: var(--text-primary);
        padding: 4px 8px;
        font-size: 11px;
        outline: none;
        transition: all 0.2s ease;
      }

      .provider-dropdown:focus, .model-dropdown:focus {
        border-color: var(--aurora-purple);
        box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
      }

      .provider-status {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
      }

      .status-indicator {
        font-size: 8px;
        color: var(--aurora-green);
      }

      .status-indicator.error {
        color: #ef4444;
      }

      .status-indicator.warning {
        color: #f59e0b;
      }

      .status-text {
        color: var(--text-secondary);
      }

      .cost-tracker {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        color: var(--text-secondary);
        padding-top: 4px;
        border-top: 1px solid rgba(139, 92, 246, 0.2);
      }

      .cost-info, .token-info {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .cost-value, .token-value {
        color: var(--aurora-blue);
        font-weight: 600;
      }

      /* Messages Container */
      .messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .messages-container::-webkit-scrollbar {
        width: 6px;
      }

      .messages-container::-webkit-scrollbar-track {
        background: transparent;
      }

      .messages-container::-webkit-scrollbar-thumb {
        background: var(--aurora-blue);
        border-radius: 3px;
      }

      /* Welcome Message */
      .welcome-message {
        text-align: center;
        padding: 20px 10px;
        background: linear-gradient(135deg,
          rgba(76, 154, 255, 0.1),
          rgba(139, 92, 246, 0.1));
        border-radius: 12px;
        border: 1px solid rgba(76, 154, 255, 0.2);
      }

      .fox-welcome {
        font-size: 32px;
        margin-bottom: 8px;
        animation: fox-bounce 2s ease-in-out infinite;
      }

      .welcome-text h3 {
        color: var(--aurora-blue);
        margin-bottom: 4px;
        font-size: 16px;
      }

      .welcome-text p {
        color: var(--text-secondary);
        font-size: 12px;
        line-height: 1.4;
      }

      /* Message Bubbles */
      .message {
        max-width: 90%;
        margin-bottom: 8px;
        animation: message-appear 0.3s ease-out;
      }

      @keyframes message-appear {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .message.user {
        align-self: flex-end;
      }

      .message.assistant {
        align-self: flex-start;
      }

      .message-content {
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.4;
        word-wrap: break-word;
      }

      .message.user .message-content {
        background: var(--aurora-blue);
        color: white;
        border-bottom-right-radius: 4px;
      }

      .message.assistant .message-content {
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-bottom-left-radius: 4px;
      }

      .message-meta {
        font-size: 10px;
        color: var(--text-secondary);
        margin-top: 4px;
        text-align: right;
      }

      .message.assistant .message-meta {
        text-align: left;
      }

      /* Thinking Indicator */
      .thinking-indicator {
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--bg-secondary);
        border-radius: 12px;
        border: 1px solid var(--border-color);
        margin-bottom: 8px;
        animation: thinking-pulse 1.5s ease-in-out infinite;
      }

      @keyframes thinking-pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }

      .fox-thinking {
        font-size: 14px;
      }

      .thinking-dots {
        display: flex;
        gap: 2px;
      }

      .thinking-dots span {
        width: 4px;
        height: 4px;
        background: var(--aurora-blue);
        border-radius: 50%;
        animation: thinking-dot 1.4s ease-in-out infinite;
      }

      .thinking-dots span:nth-child(1) { animation-delay: 0s; }
      .thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
      .thinking-dots span:nth-child(3) { animation-delay: 0.4s; }

      @keyframes thinking-dot {
        0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
        40% { transform: scale(1.2); opacity: 1; }
      }

      .thinking-text {
        font-size: 11px;
        color: var(--text-secondary);
      }

      /* Input Container */
      .input-container {
        padding: 12px;
        background: var(--bg-secondary);
        border-top: 1px solid var(--border-color);
        flex-shrink: 0;
      }

      .input-wrapper {
        display: flex;
        gap: 8px;
        align-items: flex-end;
      }

      #messageInput {
        flex: 1;
        background: var(--input-bg);
        border: 1px solid var(--input-border);
        border-radius: 8px;
        padding: 8px 12px;
        color: var(--text-primary);
        font-family: inherit;
        font-size: 13px;
        resize: none;
        min-height: 36px;
        max-height: 100px;
        transition: border-color 0.2s ease;
      }

      #messageInput:focus {
        outline: none;
        border-color: var(--aurora-blue);
        box-shadow: 0 0 0 1px var(--aurora-blue);
      }

      #messageInput::placeholder {
        color: var(--text-secondary);
      }

      .send-btn {
        background: var(--button-bg);
        border: none;
        border-radius: 8px;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .send-btn:hover {
        background: var(--button-hover);
        transform: scale(1.05);
      }

      .send-btn:active {
        transform: scale(0.95);
      }

      .send-icon {
        font-size: 14px;
      }

      /* Error Messages */
      .error-message {
        background: rgba(255, 107, 53, 0.1);
        border: 1px solid rgba(255, 107, 53, 0.3);
        color: var(--aurora-orange);
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        margin-bottom: 8px;
      }

      /* Responsive adjustments for very narrow sidebars */
      @media (max-width: 300px) {
        .header-actions {
          padding: 6px 8px;
        }

        .messages-container {
          padding: 8px;
        }

        .input-container {
          padding: 8px;
        }

        .message-content {
          padding: 6px 10px;
          font-size: 12px;
        }
      }
    </style>`;
  }

  /**
   * 🚀 Get JavaScript functionality for the webview
   */
  getWebviewJS() {
    return `
      // 🦊 Nox Chat Sidebar JavaScript
      class NoxChatSidebar {
        constructor() {
          this.vscode = acquireVsCodeApi();
          this.isAIResponding = false;

          this.initializeElements();
          this.setupEventListeners();
          this.setupKeyboardShortcuts();

          // Request initial data
          this.sendMessage({ type: 'ready' });
          this.sendMessage({ type: 'getProviderStatus' });

          console.log('🦊 Nox Chat Sidebar initialized');
        }

        initializeElements() {
          this.messageInput = document.getElementById('messageInput');
          this.sendBtn = document.getElementById('sendBtn');
          this.messagesContainer = document.getElementById('messagesContainer');
          this.thinkingIndicator = document.getElementById('thinkingIndicator');

          // Provider and model controls
          this.providerSelect = document.getElementById('providerSelect');
          this.modelSelect = document.getElementById('modelSelect');
          this.providerStatus = document.getElementById('providerStatus');
          this.statusIndicator = document.getElementById('statusIndicator');
          this.statusText = document.getElementById('statusText');
          this.sessionCost = document.getElementById('sessionCost');
          this.sessionTokens = document.getElementById('sessionTokens');

          // Initialize session tracking
          this.totalCost = 0;
          this.totalTokens = 0;
        }

        setupEventListeners() {
          // Send button click
          this.sendBtn.addEventListener('click', () => {
            this.sendUserMessage();
          });

          // Auto-resize textarea
          this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
          });

          // Provider change
          this.providerSelect.addEventListener('change', () => {
            this.handleProviderChange();
          });

          // Model change
          this.modelSelect.addEventListener('change', () => {
            this.handleModelChange();
          });

          // Handle messages from extension
          window.addEventListener('message', (event) => {
            this.handleExtensionMessage(event.data);
          });
        }

        setupKeyboardShortcuts() {
          this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              this.sendUserMessage();
            }
          });
        }

        sendUserMessage() {
          const message = this.messageInput.value.trim();
          if (!message || this.isAIResponding) return;

          this.sendMessage({
            type: 'sendMessage',
            content: message
          });

          this.messageInput.value = '';
          this.autoResizeTextarea();
        }

        sendMessage(message) {
          this.vscode.postMessage(message);
        }

        handleExtensionMessage(message) {
          switch (message.type) {
            case 'userMessage':
              this.addMessage(message.message);
              break;

            case 'aiThinking':
              this.showThinking(message.thinking);
              this.isAIResponding = message.thinking;
              break;

            case 'error':
              this.showError(message.message);
              this.isAIResponding = false;
              break;

            case 'clearMessages':
              this.clearMessages();
              break;

            case 'loadHistory':
              this.loadHistory(message.history);
              break;

            case 'providerInfo':
              this.updateProviderInfo(message.provider);
              break;

            case 'providerStatus':
              this.updateProviderStatus(message);
              break;

            case 'aiMessage':
              this.addMessage(message.message);
              // Update session costs if provided
              if (message.message.tokens || message.message.cost) {
                this.updateSessionCosts(message.message.tokens, message.message.cost);
              }
              this.isAIResponding = false;
              break;

            default:
              console.warn('Unknown message type:', message.type);
          }
        }

        addMessage(messageObj) {
          const messageEl = document.createElement('div');
          messageEl.className = \`message \${messageObj.type}\`;

          const contentEl = document.createElement('div');
          contentEl.className = 'message-content';
          contentEl.textContent = messageObj.content;

          const metaEl = document.createElement('div');
          metaEl.className = 'message-meta';

          const time = new Date(messageObj.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });

          if (messageObj.type === 'assistant') {
            const cost = messageObj.cost ? \` • $\${messageObj.cost.toFixed(4)}\` : '';
            const model = messageObj.model ? \` • \${messageObj.model}\` : '';
            metaEl.textContent = \`\${time} • \${messageObj.tokens || 0} tokens\${cost} • \${messageObj.provider || 'AI'}\${model}\`;
          } else {
            metaEl.textContent = time;
          }

          messageEl.appendChild(contentEl);
          messageEl.appendChild(metaEl);

          this.messagesContainer.appendChild(messageEl);
          this.scrollToBottom();
        }

        showThinking(show) {
          this.thinkingIndicator.style.display = show ? 'flex' : 'none';
          if (show) {
            this.scrollToBottom();
          }
        }

        showError(errorMessage) {
          const errorEl = document.createElement('div');
          errorEl.className = 'error-message';
          errorEl.textContent = \`❌ \${errorMessage}\`;

          this.messagesContainer.appendChild(errorEl);
          this.scrollToBottom();

          // Auto-remove error after 5 seconds
          setTimeout(() => {
            if (errorEl.parentNode) {
              errorEl.parentNode.removeChild(errorEl);
            }
          }, 5000);
        }

        clearMessages() {
          // Keep welcome message, remove others
          const welcomeMsg = this.messagesContainer.querySelector('.welcome-message');
          this.messagesContainer.innerHTML = '';
          if (welcomeMsg) {
            this.messagesContainer.appendChild(welcomeMsg);
          }
        }

        loadHistory(history) {
          // Clear existing messages except welcome
          this.clearMessages();

          // Add historical messages
          history.forEach(msg => {
            this.addMessage(msg);
          });
        }

        handleProviderChange() {
          const selectedProvider = this.providerSelect.value;
          console.log('🔄 Provider changed to:', selectedProvider);

          // Send provider change to extension
          this.sendMessage({
            type: 'changeProvider',
            provider: selectedProvider
          });

          // Request updated provider status
          this.sendMessage({ type: 'getProviderStatus' });
        }

        handleModelChange() {
          const selectedModel = this.modelSelect.value;
          console.log('🔄 Model changed to:', selectedModel);

          // Send model change to extension
          this.sendMessage({
            type: 'changeModel',
            model: selectedModel
          });
        }

        updateProviderStatus(data) {
          console.log('📊 Updating provider status:', data);

          // Update provider dropdown
          this.providerSelect.value = data.currentProvider;

          // Update model dropdown with current provider's models
          this.updateModelDropdown(data.providers[data.currentProvider], data.currentModel);

          // Update status indicator
          const provider = data.providers[data.currentProvider];
          if (provider.hasApiKey) {
            this.statusIndicator.className = 'status-indicator';
            this.statusText.textContent = 'Ready';
          } else {
            this.statusIndicator.className = 'status-indicator error';
            this.statusText.textContent = 'No API Key';
          }
        }

        updateModelDropdown(provider, currentModel) {
          // Clear existing options
          this.modelSelect.innerHTML = '';

          // Add model options
          provider.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = this.getModelDisplayName(model);
            if (model === currentModel) {
              option.selected = true;
            }
            this.modelSelect.appendChild(option);
          });
        }

        getModelDisplayName(model) {
          // Convert model IDs to friendly names
          const modelNames = {
            'claude-sonnet-4-5-20250929': 'Claude Sonnet 4.5',
            'claude-sonnet-4-20250514': 'Claude Sonnet 4',
            'claude-3-5-haiku-20241022': 'Claude Haiku 3.5',
            'claude-3-haiku-20240307': 'Claude Haiku 3',
            'gpt-4': 'GPT-4',
            'gpt-4-turbo': 'GPT-4 Turbo',
            'gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'deepseek-chat': 'DeepSeek Chat',
            'deepseek-coder': 'DeepSeek Coder',
            'ollama': 'Ollama',
            'lm-studio': 'LM Studio'
          };
          return modelNames[model] || model;
        }

        updateSessionCosts(tokens, cost) {
          this.totalTokens += tokens || 0;
          this.totalCost += cost || 0;

          this.sessionTokens.textContent = this.totalTokens.toLocaleString();
          this.sessionCost.textContent = '$' + this.totalCost.toFixed(4);
        }

        updateProviderInfo(provider) {
          // Could update header to show current provider
          console.log('Current AI provider:', provider);
        }

        autoResizeTextarea() {
          this.messageInput.style.height = 'auto';
          this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 100) + 'px';
        }

        scrollToBottom() {
          setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
          }, 100);
        }
      }

      // Initialize when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          new NoxChatSidebar();
        });
      } else {
        new NoxChatSidebar();
      }
    `;
  }
}

module.exports = NoxChatViewProvider;
