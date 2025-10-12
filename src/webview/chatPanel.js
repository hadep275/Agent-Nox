const vscode = require("vscode");
const path = require("path");

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
