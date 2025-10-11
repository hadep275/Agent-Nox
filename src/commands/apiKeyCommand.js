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

      // Get API key from user
      const apiKey = await vscode.window.showInputBox({
        prompt: `🔑 Enter your ${selectedProvider.label} API key`,
        password: true,
        placeHolder: "sk-...",
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return "API key cannot be empty";
          }
          if (value.length < 10) {
            return "API key seems too short";
          }
          return null;
        }
      });

      if (!apiKey) return;

      // Store the API key securely
      await this.aiClient.setApiKey(selectedProvider.id, apiKey.trim());

      vscode.window.showInformationMessage(
        `🔑 API key for ${selectedProvider.label} has been stored securely!`
      );

      this.logger.info(`API key set for provider: ${selectedProvider.id}`);

    } catch (error) {
      this.logger.error("Failed to set API key:", error);
      vscode.window.showErrorMessage(`Failed to set API key: ${error.message}`);
    }
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
