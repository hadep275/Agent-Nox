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

    // Setup message handling (must be done before content loads)
    this.setupMessageHandling();

    // Setup view events
    this.setupViewEvents();

    this.logger.info("🦊 Nox chat sidebar initialized successfully");
  }

  /**
   * 🔧 Setup message handling between webview and extension
   */
  setupMessageHandling() {
    this.logger.info("🦊 Setting up message handling...");

    this.webviewView.webview.onDidReceiveMessage(
      async (message) => {
        try {
          this.logger.info("🦊 Received message from webview:", message);

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
              this.logger.info("🦊 Handling getProviderStatus request");
              await this.sendProviderStatus();
              break;

            case "deleteMessage":
              // TODO: Implement delete message functionality
              this.logger.info("Delete message requested:", message.messageId);
              break;

            case "regenerateMessage":
              // TODO: Implement regenerate message functionality
              this.logger.info(
                "Regenerate message requested:",
                message.messageId
              );
              break;

            case "clearChat":
              this.clearChatHistory();
              break;

            case "openUrl":
              if (message.url) {
                await vscode.env.openExternal(vscode.Uri.parse(message.url));
              }
              break;

            case "providerSectionToggled":
              // Update the toggle button icon based on collapsed state
              await this.updateToggleButtonIcon(message.collapsed);
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
  sendErrorToWebview(error) {
    // Handle both simple strings and enhanced error objects
    let errorData;
    if (typeof error === "string") {
      errorData = error;
    } else if (error.enhancedInfo) {
      errorData = error;
    } else {
      errorData = error.message || error.toString();
    }

    this.sendMessageToWebview({
      type: "error",
      message: errorData,
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
        this.logger.warn("🦊 No aiClient available for provider status");
        return;
      }

      const currentProviderObj =
        this.agentController.aiClient.getCurrentProvider();

      if (!currentProviderObj || !currentProviderObj.id) {
        this.logger.error(
          "🦊 Invalid currentProvider object:",
          currentProviderObj
        );
        return;
      }

      const currentProvider = currentProviderObj.id; // Extract the ID string
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

      const messageData = {
        type: "providerStatus",
        currentProvider,
        currentModel,
        providers: providerStatus,
      };

      this.sendMessageToWebview(messageData);
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
    // Send current provider status (includes provider, model, and API key status)
    await this.sendProviderStatus();

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
   * 🎨 Get webview HTML content (using bundled architecture)
   */
  getWebviewContent() {
    const nonce = this.getNonce();

    // Get the bundled webview resources
    const webviewUri = this.webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "out",
        "webview",
        "webview.js"
      )
    );

    const vendorsUri = this.webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "out",
        "webview",
        "vendors.js"
      )
    );

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}' ${this.webviewView.webview.cspSource} 'unsafe-eval'; font-src https:;">
        <title>🦊 Nox Chat</title>
        <!-- Styles are now bundled with webpack -->
    </head>
    <body>
        <div class="aurora-bg"></div>
        <div class="chat-container">



            <!-- Provider & Model Selection (Collapsible) -->
            <div class="provider-controls" id="providerControls">
                <div class="provider-selector">
                    <label for="providerSelect">🤖 Provider:</label>
                    <select id="providerSelect" class="provider-dropdown">
                        <!-- Options will be populated dynamically by bundled JavaScript -->
                    </select>
                    <div class="provider-status" id="providerStatus">
                        <span class="status-indicator" id="statusIndicator">●</span>
                        <span class="status-text" id="statusText">Loading...</span>
                    </div>
                </div>

                <div class="model-selector">
                    <label for="modelSelect">🧠 Model:</label>
                    <select id="modelSelect" class="model-dropdown">
                        <!-- Options will be populated dynamically by bundled JavaScript -->
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
                        <div class="bundled-indicator">✨ Enterprise Bundle</div>
                    </div>
                </div>
            </div>

            <!-- Input Area -->
            <div class="input-container">
                <div class="input-wrapper">
                    <textarea id="messageInput" class="message-input" placeholder="Ask Nox anything about your code..." rows="1"></textarea>
                    <button id="sendBtn" class="send-button" title="Send message">
                        <span class="send-icon">🚀</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Load bundled JavaScript -->
        <script nonce="${nonce}" src="${vendorsUri}"></script>
        <script nonce="${nonce}" src="${webviewUri}"></script>
    </body>
    </html>`;
  }

  /**
   * 🗑️ Clear chat history
   */
  clearChatHistory() {
    try {
      this.chatHistory = [];
      this.saveChatHistory()
        .then(() => {
          // Notify webview that chat was cleared
          this.sendMessageToWebview({
            type: "clearMessages",
          });
          this.logger.info("🗑️ Chat history cleared");
        })
        .catch((error) => {
          this.logger.error("Failed to clear chat history:", error);
          this.sendErrorToWebview(
            "Failed to clear chat history: " + error.message
          );
        });
    } catch (error) {
      this.logger.error("Failed to clear chat history:", error);
      this.sendErrorToWebview("Failed to clear chat history: " + error.message);
    }
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
   * 🎨 CSS is now bundled with webpack - this method is deprecated
   */
  getWebviewCSS() {
    // All CSS is now handled by bundled stylesheets
    return "";
  }

  /**
   * JavaScript functionality is now handled by bundled webview
   */
  getWebviewJS() {
    return "";
  }

  /**
   * 🔄 Update toggle button icon based on collapsed state
   */
  async updateToggleButtonIcon(collapsed) {
    try {
      // Update the command icon in package.json dynamically
      const newIcon = collapsed ? "$(chevron-right)" : "$(chevron-down)";

      // We can't dynamically update package.json commands, but we can log the state
      this.logger.info(
        `🦊 Provider section ${
          collapsed ? "collapsed" : "expanded"
        } - icon should be ${newIcon}`
      );

      // Note: VS Code doesn't support dynamic command icon updates
      // The icon animation would need to be handled in CSS within the webview
    } catch (error) {
      this.logger.error("Error updating toggle button icon:", error);
    }
  }
}

module.exports = NoxChatViewProvider;
