const vscode = require("vscode");
const axios = require("axios");

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
    this.currentModel = null; // Will be set to default model of current provider
    this.providers = {
      anthropic: {
        name: "🤖 Anthropic Claude",
        models: [
          "claude-sonnet-4-5-20250929",
          "claude-sonnet-4-20250514",
          "claude-3-5-haiku-20241022",
          "claude-3-haiku-20240307",
        ],
        baseUrl: "https://api.anthropic.com/v1",
        defaultModel: "claude-sonnet-4-5-20250929",
      },
      openai: {
        name: "🧠 OpenAI GPT",
        models: [
          // 🏆 Main Production Models
          "chatgpt-4o-latest", // Always latest GPT-4o
          "gpt-4o", // Latest stable GPT-4o
          "gpt-4o-mini", // Cost-effective, fast
          "gpt-4-turbo", // Most capable reasoning
          "gpt-3.5-turbo", // Legacy, cheapest

          // 🚀 Next Generation (if available)
          "gpt-4.1", // Newest generation
          "gpt-5", // Next-gen (preview)

          // 🎯 Specialized Models
          "gpt-4o-audio-preview", // Voice/audio processing
          "gpt-4o-search-preview", // Enhanced search
          "gpt-4o-realtime-preview", // Live conversations
        ],
        baseUrl: "https://api.openai.com/v1",
        defaultModel: "gpt-4o-mini", // Best value for most tasks
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

      // Set default model for current provider
      this.currentModel = this.providers[this.currentProvider].defaultModel;

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
   * 🤖 Send request to AI provider - REAL IMPLEMENTATION
   */
  async sendRequest(prompt, options = {}) {
    if (!this.isInitialized) {
      throw new Error("AI Client not initialized");
    }

    const timer = this.performanceMonitor.startTimer("ai_request");
    const provider = this.providers[this.currentProvider];

    try {
      this.logger.info(`🤖 Sending request to ${provider.name}...`);

      // Get API key
      const apiKey = await this.getApiKey(this.currentProvider);
      if (!apiKey) {
        throw new Error(
          `No API key configured for ${provider.name}. Please set up your API key first.`
        );
      }

      // Route to appropriate provider
      let response;
      const requestOptions = {
        ...options,
        model: options.model || this.currentModel,
      };

      switch (this.currentProvider) {
        case "anthropic":
          response = await this.callAnthropicAPI(
            apiKey,
            prompt,
            requestOptions
          );
          break;
        case "openai":
          response = await this.callOpenAIAPI(apiKey, prompt, requestOptions);
          break;
        case "deepseek":
          response = await this.callDeepSeekAPI(apiKey, prompt, requestOptions);
          break;
        case "local":
          response = await this.callLocalAPI(prompt, requestOptions);
          break;
        default:
          throw new Error(`Unsupported provider: ${this.currentProvider}`);
      }

      timer.end();
      this.performanceMonitor.recordCost(
        response.provider,
        response.model,
        response.tokens,
        response.cost
      );

      this.logger.info(`🤖 Request completed in ${timer.duration}ms`);
      return response;
    } catch (error) {
      timer.end();
      this.logger.error("AI request failed:", error);
      throw error;
    }
  }

  /**
   * 🤖 Call Anthropic Claude API
   */
  async callAnthropicAPI(apiKey, prompt, options = {}) {
    try {
      const model = options.model || this.providers.anthropic.defaultModel;
      const maxTokens = options.maxTokens || 4000;

      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: model,
          max_tokens: maxTokens,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          timeout: 60000, // 60 second timeout
        }
      );

      const data = response.data;

      return {
        content: data.content[0].text,
        provider: "anthropic",
        model: model,
        tokens: data.usage.input_tokens + data.usage.output_tokens,
        cost: this.calculateAnthropicCost(data.usage, model),
      };
    } catch (error) {
      this.logger.error("Anthropic API call failed:", error);

      if (error.response) {
        const errorMessage =
          error.response.data?.error?.message ||
          error.response.data?.message ||
          JSON.stringify(error.response.data);
        throw new Error(
          `Anthropic API error: ${error.response.status} - ${errorMessage}`
        );
      } else if (error.request) {
        throw new Error("Anthropic API: No response received");
      } else {
        throw new Error(`Anthropic API: ${error.message}`);
      }
    }
  }

  /**
   * 🧠 Call OpenAI GPT API
   */
  async callOpenAIAPI(apiKey, prompt, options = {}) {
    try {
      const model = options.model || this.providers.openai.defaultModel;
      const maxTokens = options.maxTokens || 4000;

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: maxTokens,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 60000, // 60 second timeout
        }
      );

      const data = response.data;

      return {
        content: data.choices[0].message.content,
        provider: "openai",
        model: model,
        tokens: data.usage.total_tokens,
        cost: this.calculateOpenAICost(data.usage, model),
      };
    } catch (error) {
      this.logger.error("OpenAI API call failed:", error);

      // Handle axios errors properly
      if (error.response) {
        const errorMessage =
          error.response.data?.error?.message ||
          error.response.data?.message ||
          JSON.stringify(error.response.data);
        throw new Error(
          `OpenAI API error: ${error.response.status} - ${errorMessage}`
        );
      } else if (error.request) {
        throw new Error("OpenAI API: No response received");
      } else {
        throw new Error(`OpenAI API: ${error.message}`);
      }
    }
  }

  /**
   * ⚡ Call DeepSeek API
   */
  async callDeepSeekAPI(apiKey, prompt, options = {}) {
    try {
      const model = options.model || this.providers.deepseek.defaultModel;
      const maxTokens = options.maxTokens || 4000;

      const response = await axios.post(
        "https://api.deepseek.com/v1/chat/completions",
        {
          model: model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: maxTokens,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 60000, // 60 second timeout
        }
      );

      const data = response.data;

      return {
        content: data.choices[0].message.content,
        provider: "deepseek",
        model: model,
        tokens: data.usage.total_tokens,
        cost: this.calculateDeepSeekCost(data.usage, model),
      };
    } catch (error) {
      this.logger.error("DeepSeek API call failed:", error);

      // Handle axios errors properly
      if (error.response) {
        throw new Error(
          `DeepSeek API error: ${error.response.status} - ${
            error.response.data.error?.message || error.response.data
          }`
        );
      } else if (error.request) {
        throw new Error("DeepSeek API: No response received");
      } else {
        throw new Error(`DeepSeek API: ${error.message}`);
      }
    }
  }

  /**
   * 🏠 Call Local LLM API (Ollama/LM Studio)
   */
  async callLocalAPI(prompt, options = {}) {
    try {
      const model = options.model || "llama2";
      const baseUrl = options.baseUrl || this.providers.local.baseUrl;

      const response = await axios.post(
        `${baseUrl}/api/generate`,
        {
          model: model,
          prompt: prompt,
          stream: false,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 120000, // 2 minute timeout for local models
        }
      );

      const data = response.data;

      return {
        content: data.response,
        provider: "local",
        model: model,
        tokens: 0, // Local models don't track tokens
        cost: 0, // Local models are free
      };
    } catch (error) {
      this.logger.error("Local LLM API call failed:", error);

      // Handle axios errors properly
      if (error.response) {
        throw new Error(
          `Local LLM API error: ${error.response.status} - ${error.response.data}`
        );
      } else if (error.request) {
        throw new Error(
          "Local LLM API: No response received - is your local LLM server running?"
        );
      } else {
        throw new Error(`Local LLM API: ${error.message}`);
      }
    }
  }

  /**
   * 💰 Calculate Anthropic API costs
   */
  calculateAnthropicCost(usage, model) {
    // Anthropic pricing (as of 2024)
    const pricing = {
      "claude-3-sonnet-20240229": { input: 0.003, output: 0.015 }, // per 1K tokens
      "claude-3-haiku-20240307": { input: 0.00025, output: 0.00125 },
    };

    const rates = pricing[model] || pricing["claude-3-sonnet-20240229"];
    return (
      (usage.input_tokens * rates.input + usage.output_tokens * rates.output) /
      1000
    );
  }

  /**
   * 💰 Calculate OpenAI API costs
   */
  calculateOpenAICost(usage, model) {
    // OpenAI pricing (as of 2024-2025)
    const pricing = {
      // 🏆 Main Production Models
      "chatgpt-4o-latest": { input: 0.0025, output: 0.01 },
      "gpt-4o": { input: 0.0025, output: 0.01 },
      "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
      "gpt-4-turbo": { input: 0.01, output: 0.03 },
      "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },

      // 🚀 Next Generation (estimated pricing)
      "gpt-4.1": { input: 0.005, output: 0.015 },
      "gpt-5": { input: 0.01, output: 0.03 },

      // 🎯 Specialized Models (premium pricing)
      "gpt-4o-audio-preview": { input: 0.005, output: 0.02 },
      "gpt-4o-search-preview": { input: 0.005, output: 0.02 },
      "gpt-4o-realtime-preview": { input: 0.005, output: 0.02 },

      // Legacy models (deprecated but still available)
      "gpt-4": { input: 0.03, output: 0.06 },
      "gpt-4o-2024-11-20": { input: 0.0025, output: 0.01 },
      "gpt-4o-mini-2024-07-18": { input: 0.00015, output: 0.0006 },
    };

    const rates = pricing[model] || pricing["gpt-4o-mini"];
    return (
      (usage.prompt_tokens * rates.input +
        usage.completion_tokens * rates.output) /
      1000
    );
  }

  /**
   * 💰 Calculate DeepSeek API costs
   */
  calculateDeepSeekCost(usage, model) {
    // DeepSeek pricing (very competitive)
    const pricing = {
      "deepseek-chat": { input: 0.00014, output: 0.00028 }, // per 1K tokens
      "deepseek-coder": { input: 0.00014, output: 0.00028 },
    };

    const rates = pricing[model] || pricing["deepseek-chat"];
    return (
      (usage.prompt_tokens * rates.input +
        usage.completion_tokens * rates.output) /
      1000
    );
  }

  /**
   * 🔄 Set current provider
   */
  async setCurrentProvider(provider) {
    if (!this.providers[provider]) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    this.currentProvider = provider;
    this.currentModel = this.providers[provider].defaultModel;

    // Update configuration
    const config = vscode.workspace.getConfiguration("nox");
    await config.update(
      "aiProvider",
      provider,
      vscode.ConfigurationTarget.Global
    );

    this.logger.info(`🔄 Current provider set to: ${provider}`);
  }

  /**
   * 🔄 Set current model
   */
  async setCurrentModel(model) {
    const provider = this.providers[this.currentProvider];
    if (!provider.models.includes(model)) {
      throw new Error(
        `Model ${model} not available for provider ${this.currentProvider}`
      );
    }

    this.currentModel = model;
    this.logger.info(`🔄 Current model set to: ${model}`);
  }

  /**
   * 📋 Get current provider ID (string)
   */
  getCurrentProviderId() {
    return this.currentProvider;
  }

  /**
   * 📋 Get current model
   */
  getCurrentModel() {
    return (
      this.currentModel || this.providers[this.currentProvider].defaultModel
    );
  }

  /**
   * 📋 Get all providers
   */
  getProviders() {
    return this.providers;
  }

  /**
   * 📋 Get models for current provider
   */
  getCurrentProviderModels() {
    return this.providers[this.currentProvider].models;
  }

  /**
   * 📋 Get models for specific provider
   */
  getProviderModels(provider) {
    return this.providers[provider]?.models || [];
  }

  /**
   * 🚨 Enhanced error message formatting
   */
  formatErrorMessage(error, provider) {
    const errorInfo = this.categorizeError(error, provider);

    return {
      title: errorInfo.title,
      message: errorInfo.message,
      suggestion: errorInfo.suggestion,
      category: errorInfo.category,
      helpUrl: errorInfo.helpUrl,
    };
  }

  /**
   * 🔍 Categorize and enhance error messages
   */
  categorizeError(error, provider) {
    const errorMessage = error.message || error.toString();

    // API Key errors
    if (
      errorMessage.includes("401") ||
      errorMessage.includes("Unauthorized") ||
      errorMessage.includes("Invalid API key")
    ) {
      return {
        title: "🔑 API Key Issue",
        message: `Your ${
          this.providers[provider]?.name || provider
        } API key appears to be invalid or missing.`,
        suggestion: `Please check your API key in Nox Settings and ensure it's correctly configured for ${provider}.`,
        category: "api_key",
        helpUrl: this.getProviderHelpUrl(provider, "api_key"),
      };
    }

    // Rate limit errors
    if (
      errorMessage.includes("429") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("quota")
    ) {
      return {
        title: "⏱️ Rate Limit Exceeded",
        message: `You've exceeded the rate limit for ${
          this.providers[provider]?.name || provider
        }.`,
        suggestion:
          "Please wait a moment before trying again, or consider upgrading your API plan for higher limits.",
        category: "rate_limit",
        helpUrl: this.getProviderHelpUrl(provider, "rate_limit"),
      };
    }

    // Network errors
    if (
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("timeout")
    ) {
      return {
        title: "🌐 Network Connection Issue",
        message: "Unable to connect to the AI service.",
        suggestion:
          "Please check your internet connection and try again. If using a local LLM, ensure the server is running.",
        category: "network",
        helpUrl: this.getProviderHelpUrl(provider, "network"),
      };
    }

    // Model errors
    if (
      errorMessage.includes("404") ||
      errorMessage.includes("model") ||
      errorMessage.includes("not found")
    ) {
      return {
        title: "🤖 Model Not Available",
        message: `The selected model is not available or doesn't exist for ${
          this.providers[provider]?.name || provider
        }.`,
        suggestion:
          "Please select a different model from the dropdown or check if your API plan includes access to this model.",
        category: "model",
        helpUrl: this.getProviderHelpUrl(provider, "model"),
      };
    }

    // Token/context errors
    if (
      errorMessage.includes("context") ||
      errorMessage.includes("token") ||
      errorMessage.includes("too long")
    ) {
      return {
        title: "📏 Message Too Long",
        message: "Your message exceeds the maximum token limit for this model.",
        suggestion:
          "Please shorten your message or break it into smaller parts.",
        category: "context",
        helpUrl: this.getProviderHelpUrl(provider, "context"),
      };
    }

    // Generic error
    return {
      title: "❌ Unexpected Error",
      message: errorMessage,
      suggestion:
        "Please try again. If the problem persists, check your API key and internet connection.",
      category: "generic",
      helpUrl: this.getProviderHelpUrl(provider, "generic"),
    };
  }

  /**
   * 🔗 Get help URLs for different providers and error types
   */
  getProviderHelpUrl(provider, errorType) {
    const helpUrls = {
      anthropic: {
        api_key: "https://console.anthropic.com/account/keys",
        rate_limit: "https://docs.anthropic.com/claude/reference/rate-limits",
        model: "https://docs.anthropic.com/claude/docs/models-overview",
        network: "https://docs.anthropic.com/claude/reference/getting-started",
        context:
          "https://docs.anthropic.com/claude/docs/models-overview#context-window",
        generic: "https://docs.anthropic.com/claude/reference/errors",
      },
      openai: {
        api_key: "https://platform.openai.com/account/api-keys",
        rate_limit: "https://platform.openai.com/docs/guides/rate-limits",
        model: "https://platform.openai.com/docs/models",
        network: "https://platform.openai.com/docs/quickstart",
        context: "https://platform.openai.com/docs/guides/text-generation",
        generic: "https://platform.openai.com/docs/guides/error-codes",
      },
      deepseek: {
        api_key: "https://platform.deepseek.com/api_keys",
        rate_limit: "https://platform.deepseek.com/docs",
        model: "https://platform.deepseek.com/docs",
        network: "https://platform.deepseek.com/docs",
        context: "https://platform.deepseek.com/docs",
        generic: "https://platform.deepseek.com/docs",
      },
      local: {
        api_key: null,
        rate_limit: null,
        model: "https://ollama.com/library",
        network: "https://ollama.com/docs",
        context: "https://ollama.com/docs",
        generic: "https://ollama.com/docs",
      },
    };

    return helpUrls[provider]?.[errorType] || null;
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
