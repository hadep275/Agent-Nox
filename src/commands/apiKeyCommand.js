const vscode = require("vscode");

/**
 * 🔑 Nox API Key Management Command
 * Handles secure API key configuration for all providers
 */
class ApiKeyCommand {
  constructor(context, logger, aiClient) {
    this.context = context;
    this.logger = logger;
    this.aiClient = aiClient;
  }

  /**
   * 🔑 Main API key management command
   */
  async execute() {
    try {
      this.logger.info("🔑 Opening API key management...");

      const action = await vscode.window.showQuickPick([
        {
          label: "🔑 Set API Key",
          description: "Configure API key for an AI provider",
          action: "set"
        },
        {
          label: "👀 View Configured Providers",
          description: "See which providers have API keys set",
          action: "view"
        },
        {
          label: "🔄 Switch Provider",
          description: "Change the active AI provider",
          action: "switch"
        },
        {
          label: "🗑️ Remove API Key",
          description: "Delete API key for a provider",
          action: "remove"
        }
      ], {
        placeHolder: "🦊 What would you like to do with API keys?"
      });

      if (!action) return;

      switch (action.action) {
        case "set":
          await this.setApiKey();
          break;
        case "view":
          await this.viewConfiguredProviders();
          break;
        case "switch":
          await this.switchProvider();
          break;
        case "remove":
          await this.removeApiKey();
          break;
      }

    } catch (error) {
      this.logger.error("API key management failed:", error);
      vscode.window.showErrorMessage(`🦊 API key management failed: ${error.message}`);
    }
  }

  /**
   * 🔑 Set API key for a provider
   */
  async setApiKey() {
    try {
      // Select provider
      const providers = this.aiClient.getAvailableProviders();
      const selectedProvider = await vscode.window.showQuickPick(
        providers.map(p => ({
          label: p.name,
          description: `Set API key for ${p.name}`,
          id: p.id
        })),
        { placeHolder: "🤖 Select AI provider" }
      );

      if (!selectedProvider) return;

      // Create webview panel for better API key input
      await this.showApiKeyInputPanel(selectedProvider);

    } catch (error) {
      this.logger.error("Failed to set API key:", error);
      vscode.window.showErrorMessage(`🦊 API key management failed: ${error.message}`);
    }
  }

  /**
   * 🔑 Show API key input panel with better UX
   */
  async showApiKeyInputPanel(provider) {
    const panel = vscode.window.createWebviewPanel(
      'noxApiKey',
      `🔑 ${provider.label} API Key`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    // Set webview content
    panel.webview.html = this.getApiKeyInputHtml(provider);

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'saveApiKey':
            try {
              const apiKey = message.apiKey?.trim();

              if (!apiKey) {
                panel.webview.postMessage({
                  type: 'error',
                  message: 'API key cannot be empty'
                });
                return;
              }

              if (apiKey.length < 10) {
                panel.webview.postMessage({
                  type: 'error',
                  message: 'API key seems too short'
                });
                return;
              }

              // Store the API key securely
              await this.aiClient.setApiKey(provider.id, apiKey);

              // Show success
              panel.webview.postMessage({
                type: 'success',
                message: `API key for ${provider.label} saved successfully!`
              });

              // Close panel after short delay
              setTimeout(() => {
                panel.dispose();
              }, 2000);

              vscode.window.showInformationMessage(
                `🔑 API key for ${provider.label} has been stored securely!`
              );

              this.logger.info(`API key set for provider: ${provider.id}`);

            } catch (error) {
              this.logger.error("Failed to save API key:", error);
              panel.webview.postMessage({
                type: 'error',
                message: `Failed to save API key: ${error.message}`
              });
            }
            break;

          case 'cancel':
            panel.dispose();
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  /**
   * 🎨 Get HTML for API key input panel
   */
  getApiKeyInputHtml(provider) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🔑 ${provider.label} API Key</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                padding: 20px;
                margin: 0;
            }

            .container {
                max-width: 500px;
                margin: 0 auto;
            }

            .header {
                text-align: center;
                margin-bottom: 30px;
            }

            .provider-icon {
                font-size: 48px;
                margin-bottom: 10px;
            }

            .form-group {
                margin-bottom: 20px;
            }

            label {
                display: block;
                margin-bottom: 8px;
                font-weight: bold;
                color: var(--vscode-input-foreground);
            }

            .input-container {
                position: relative;
                display: flex;
                align-items: center;
            }

            input[type="password"], input[type="text"] {
                width: 100%;
                padding: 12px 40px 12px 12px;
                border: 1px solid var(--vscode-input-border);
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
            }

            input:focus {
                outline: none;
                border-color: var(--vscode-focusBorder);
                box-shadow: 0 0 0 1px var(--vscode-focusBorder);
            }

            .toggle-btn {
                position: absolute;
                right: 8px;
                background: none;
                border: none;
                color: var(--vscode-input-foreground);
                cursor: pointer;
                padding: 4px;
                border-radius: 2px;
                font-size: 16px;
            }

            .toggle-btn:hover {
                background: var(--vscode-toolbar-hoverBackground);
            }

            .buttons {
                display: flex;
                gap: 12px;
                justify-content: center;
                margin-top: 30px;
            }

            button {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                min-width: 100px;
            }

            .save-btn {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }

            .save-btn:hover {
                background: var(--vscode-button-hoverBackground);
            }

            .save-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .cancel-btn {
                background: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }

            .cancel-btn:hover {
                background: var(--vscode-button-secondaryHoverBackground);
            }

            .message {
                margin-top: 15px;
                padding: 10px;
                border-radius: 4px;
                text-align: center;
                font-weight: bold;
            }

            .error {
                background: var(--vscode-inputValidation-errorBackground);
                color: var(--vscode-inputValidation-errorForeground);
                border: 1px solid var(--vscode-inputValidation-errorBorder);
            }

            .success {
                background: var(--vscode-terminal-ansiGreen);
                color: var(--vscode-editor-background);
            }

            .help-text {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin-top: 8px;
                line-height: 1.4;
            }

            .aurora-glow {
                background: linear-gradient(45deg, #4c9aff, #8b5cf6, #10b981);
                background-size: 200% 200%;
                animation: aurora 3s ease-in-out infinite;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            @keyframes aurora {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="provider-icon">🤖</div>
                <h1 class="aurora-glow">${provider.label} API Key</h1>
                <p>Enter your API key to enable ${provider.label} integration</p>
            </div>

            <form id="apiKeyForm">
                <div class="form-group">
                    <label for="apiKey">🔑 API Key:</label>
                    <div class="input-container">
                        <input type="password" id="apiKey" placeholder="Enter your ${provider.label} API key..." autocomplete="off">
                        <button type="button" class="toggle-btn" id="toggleBtn" title="Show/Hide API Key">👁️</button>
                    </div>
                    <div class="help-text">
                        Your API key will be stored securely in VS Code's encrypted storage.
                        ${this.getProviderHelp(provider.id)}
                    </div>
                </div>

                <div class="buttons">
                    <button type="submit" class="save-btn" id="saveBtn">💾 Save API Key</button>
                    <button type="button" class="cancel-btn" id="cancelBtn">❌ Cancel</button>
                </div>

                <div id="message" class="message" style="display: none;"></div>
            </form>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const apiKeyInput = document.getElementById('apiKey');
            const toggleBtn = document.getElementById('toggleBtn');
            const saveBtn = document.getElementById('saveBtn');
            const cancelBtn = document.getElementById('cancelBtn');
            const messageDiv = document.getElementById('message');
            const form = document.getElementById('apiKeyForm');

            // Toggle password visibility
            toggleBtn.addEventListener('click', () => {
                if (apiKeyInput.type === 'password') {
                    apiKeyInput.type = 'text';
                    toggleBtn.textContent = '🙈';
                    toggleBtn.title = 'Hide API Key';
                } else {
                    apiKeyInput.type = 'password';
                    toggleBtn.textContent = '👁️';
                    toggleBtn.title = 'Show API Key';
                }
            });

            // Form submission
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const apiKey = apiKeyInput.value.trim();

                if (!apiKey) {
                    showMessage('API key cannot be empty', 'error');
                    return;
                }

                if (apiKey.length < 10) {
                    showMessage('API key seems too short', 'error');
                    return;
                }

                saveBtn.disabled = true;
                saveBtn.textContent = '💾 Saving...';

                vscode.postMessage({
                    type: 'saveApiKey',
                    apiKey: apiKey
                });
            });

            // Cancel button
            cancelBtn.addEventListener('click', () => {
                vscode.postMessage({ type: 'cancel' });
            });

            // Handle messages from extension
            window.addEventListener('message', event => {
                const message = event.data;

                switch (message.type) {
                    case 'error':
                        showMessage(message.message, 'error');
                        saveBtn.disabled = false;
                        saveBtn.textContent = '💾 Save API Key';
                        break;

                    case 'success':
                        showMessage(message.message, 'success');
                        saveBtn.disabled = true;
                        saveBtn.textContent = '✅ Saved!';
                        break;
                }
            });

            function showMessage(text, type) {
                messageDiv.textContent = text;
                messageDiv.className = 'message ' + type;
                messageDiv.style.display = 'block';

                if (type === 'error') {
                    setTimeout(() => {
                        messageDiv.style.display = 'none';
                    }, 5000);
                }
            }

            // Focus on input
            apiKeyInput.focus();
        </script>
    </body>
    </html>`;
  }

  /**
   * 📖 Get provider-specific help text
   */
  getProviderHelp(providerId) {
    const helpTexts = {
      anthropic: "Get your API key from: https://console.anthropic.com/",
      openai: "Get your API key from: https://platform.openai.com/api-keys",
      deepseek: "Get your API key from: https://platform.deepseek.com/",
      local: "No API key needed for local models. Make sure Ollama or LM Studio is running."
    };

    return helpTexts[providerId] || "Check your provider's documentation for API key instructions.";
  }

  /**
   * 👀 View configured providers
   */
  async viewConfiguredProviders() {
    try {
      const configuredProviders = await this.aiClient.getConfiguredProviders();
      const currentProvider = this.aiClient.getCurrentProvider();

      if (configuredProviders.length === 0) {
        vscode.window.showInformationMessage(
          "🔑 No API keys configured yet. Use 'Set API Key' to get started!"
        );
        return;
      }

      const items = configuredProviders.map(provider => ({
        label: `${provider.id === currentProvider.id ? "✅" : "⚪"} ${provider.name}`,
        description: provider.id === currentProvider.id ? "Currently active" : "Available",
        detail: `Models: ${provider.models.join(", ")}`
      }));

      await vscode.window.showQuickPick(items, {
        placeHolder: "🦊 Configured AI Providers",
        canPickMany: false
      });

    } catch (error) {
      this.logger.error("Failed to view providers:", error);
      vscode.window.showErrorMessage(`Failed to view providers: ${error.message}`);
    }
  }

  /**
   * 🔄 Switch active provider
   */
  async switchProvider() {
    try {
      const configuredProviders = await this.aiClient.getConfiguredProviders();
      const currentProvider = this.aiClient.getCurrentProvider();

      if (configuredProviders.length === 0) {
        vscode.window.showWarningMessage(
          "🔑 No API keys configured. Please set up API keys first!"
        );
        return;
      }

      const selectedProvider = await vscode.window.showQuickPick(
        configuredProviders
          .filter(p => p.id !== currentProvider.id)
          .map(p => ({
            label: p.name,
            description: `Switch to ${p.name}`,
            detail: `Models: ${p.models.join(", ")}`,
            id: p.id
          })),
        { placeHolder: `🔄 Switch from ${currentProvider.name}` }
      );

      if (!selectedProvider) return;

      await this.aiClient.setProvider(selectedProvider.id);

      vscode.window.showInformationMessage(
        `🔄 Switched to ${selectedProvider.label}!`
      );

    } catch (error) {
      this.logger.error("Failed to switch provider:", error);
      vscode.window.showErrorMessage(`Failed to switch provider: ${error.message}`);
    }
  }

  /**
   * 🗑️ Remove API key
   */
  async removeApiKey() {
    try {
      const configuredProviders = await this.aiClient.getConfiguredProviders();

      if (configuredProviders.length === 0) {
        vscode.window.showInformationMessage("🔑 No API keys to remove.");
        return;
      }

      const selectedProvider = await vscode.window.showQuickPick(
        configuredProviders.map(p => ({
          label: `🗑️ ${p.name}`,
          description: "Remove API key",
          id: p.id
        })),
        { placeHolder: "🗑️ Select provider to remove API key" }
      );

      if (!selectedProvider) return;

      // Confirm deletion
      const confirm = await vscode.window.showWarningMessage(
        `🗑️ Are you sure you want to remove the API key for ${selectedProvider.label}?`,
        { modal: true },
        "Yes, Remove",
        "Cancel"
      );

      if (confirm !== "Yes, Remove") return;

      await this.aiClient.removeApiKey(selectedProvider.id);

      vscode.window.showInformationMessage(
        `🗑️ API key for ${selectedProvider.label} has been removed.`
      );

    } catch (error) {
      this.logger.error("Failed to remove API key:", error);
      vscode.window.showErrorMessage(`Failed to remove API key: ${error.message}`);
    }
  }
}

module.exports = ApiKeyCommand;
