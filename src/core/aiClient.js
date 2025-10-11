const vscode = require("vscode");

/**
 * 🦊 Nox AI Client - Multi-provider support with user-controlled API keys
 * Enterprise-grade AI client with secure API key management
 */
class AIClient {
  constructor(context, logger, performanceMonitor) {
    this.context = context;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.isInitialized = false;
    this.currentProvider = "anthropic";
    this.providers = {
      anthropic: {
        name: "🤖 Anthropic Claude",
        models: ["claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
        baseUrl: "https://api.anthropic.com/v1",
        defaultModel: "claude-3-sonnet-20240229",
      },
      openai: {
        name: "🧠 OpenAI GPT",
        models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
        baseUrl: "https://api.openai.com/v1",
        defaultModel: "gpt-4",
      },
      deepseek: {
        name: "⚡ DeepSeek",
        models: ["deepseek-chat", "deepseek-coder"],
        baseUrl: "https://api.deepseek.com/v1",
        defaultModel: "deepseek-chat",
      },
      local: {
        name: "🏠 Local LLM",
        models: ["ollama", "lm-studio"],
        baseUrl: "http://localhost:11434",
        defaultModel: "ollama",
      },
    };
  }

  /**
   * 🔐 Get API key securely from VS Code SecretStorage
   */
  async getApiKey(provider) {
    try {
      const secretKey = `nox.${provider}.apiKey`;
      const apiKey = await this.context.secrets.get(secretKey);

      if (!apiKey) {
        this.logger.warn(`🔑 No API key found for ${provider}`);
        return null;
      }

      this.logger.info(`🔑 Retrieved API key for ${provider}`);
      return apiKey;
    } catch (error) {
      this.logger.error(`Failed to retrieve API key for ${provider}:`, error);
      return null;
    }
  }

  /**
   * 🔐 Store API key securely in VS Code SecretStorage
   */
  async setApiKey(provider, apiKey) {
    try {
      const secretKey = `nox.${provider}.apiKey`;
      await this.context.secrets.store(secretKey, apiKey);

      this.logger.info(`🔑 Stored API key for ${provider} securely`);

      // Also update VS Code settings for UI display (without the actual key)
      const config = vscode.workspace.getConfiguration("nox");
      await config.update(
        `${provider}.apiKey`,
        "••••••••",
        vscode.ConfigurationTarget.Global
      );

      return true;
    } catch (error) {
      this.logger.error(`Failed to store API key for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * 🔐 Remove API key from secure storage
   */
  async removeApiKey(provider) {
    try {
      const secretKey = `nox.${provider}.apiKey`;
      await this.context.secrets.delete(secretKey);

      // Also clear from VS Code settings
      const config = vscode.workspace.getConfiguration("nox");
      await config.update(
        `${provider}.apiKey`,
        "",
        vscode.ConfigurationTarget.Global
      );

      this.logger.info(`🔑 Removed API key for ${provider}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove API key for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * 🔍 Check if provider has valid API key
   */
  async hasValidApiKey(provider) {
    const apiKey = await this.getApiKey(provider);
    return apiKey && apiKey.length > 0;
  }

  /**
   * Initialize AI client with configuration
   */
  async initialize(configuration) {
    try {
      this.logger.info("🦊 Initializing Nox AI client...");

      this.currentProvider = configuration.get("aiProvider", "anthropic");

      // Check for available API keys
      const availableProviders = [];
      for (const provider of Object.keys(this.providers)) {
        if (await this.hasValidApiKey(provider)) {
          availableProviders.push(provider);
        }
      }

      this.logger.info(
        `🔑 Available providers: ${availableProviders.join(", ")}`
      );

      if (availableProviders.length === 0) {
        this.logger.warn(
          "⚠️ No API keys configured. Please set up your API keys in Nox settings."
        );
      }

      this.logger.info("🦊 Nox AI client initialized successfully");
      this.isInitialized = true;
    } catch (error) {
      this.logger.error("Failed to initialize AI Client:", error);
      throw error;
    }
  }

  /**
   * 🔄 Switch AI provider
   */
  async setProvider(provider) {
    try {
      if (!this.providers[provider]) {
        throw new Error(`Unknown AI provider: ${provider}`);
      }

      const hasKey = await this.hasValidApiKey(provider);
      if (!hasKey) {
        throw new Error(
          `No API key configured for ${provider}. Please set up your API key first.`
        );
      }

      this.currentProvider = provider;
      this.logger.info(
        `🔄 Switched to AI provider: ${this.providers[provider].name}`
      );

      // Update configuration
      const config = vscode.workspace.getConfiguration("nox");
      await config.update(
        "aiProvider",
        provider,
        vscode.ConfigurationTarget.Global
      );

      return true;
    } catch (error) {
      this.logger.error(`Failed to switch provider to ${provider}:`, error);
      throw error;
    }
  }

  /**
   * 📋 Get current provider info
   */
  getCurrentProvider() {
    return {
      id: this.currentProvider,
      ...this.providers[this.currentProvider],
    };
  }

  /**
   * 📋 Get all available providers
   */
  getAvailableProviders() {
    return Object.keys(this.providers).map((id) => ({
      id,
      ...this.providers[id],
    }));
  }

  /**
   * 📋 Get providers with valid API keys
   */
  async getConfiguredProviders() {
    const configured = [];
    for (const provider of Object.keys(this.providers)) {
      if (await this.hasValidApiKey(provider)) {
        configured.push({
          id: provider,
          ...this.providers[provider],
        });
      }
    }
    return configured;
  }

  /**
   * Update configuration
   */
  async updateConfiguration(configuration) {
    try {
      const newProvider = configuration.get("aiProvider");
      if (newProvider !== this.currentProvider) {
        await this.setProvider(newProvider);
      }
    } catch (error) {
      this.logger.error("Failed to update AI Client configuration:", error);
    }
  }

  /**
   * Send request to AI provider (placeholder)
   */
  async sendRequest(prompt, _options = {}) {
    if (!this.isInitialized) {
      throw new Error("AI Client not initialized");
    }

    const timer = this.performanceMonitor.startTimer("ai_request");

    try {
      // TODO: Implement actual AI API calls in Phase 2
      const response = {
        content: `AI response placeholder for prompt: ${prompt.substring(
          0,
          50
        )}...`,
        provider: this.currentProvider,
        model: "placeholder-model",
        tokens: 100,
        cost: 0.001,
      };

      timer.end();
      this.performanceMonitor.recordCost(
        response.provider,
        response.model,
        response.tokens,
        response.cost
      );

      return response;
    } catch (error) {
      timer.end();
      this.logger.error("AI request failed:", error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      this.logger.info("Cleaning up AI Client...");
      this.isInitialized = false;
    } catch (error) {
      this.logger.error("Error during AI Client cleanup:", error);
    }
  }
}

module.exports = AIClient;
