const vscode = require("vscode");
const path = require("path");

// NOX consciousness components
const NoxSystemPrompt = require("./noxSystemPrompt");
const NoxCapabilities = require("./noxCapabilities");
const NoxContextBuilder = require("./noxContextBuilder");

/**
 * Main Agent Controller - orchestrates all agent operations with enterprise-grade architecture
 */
class AgentController {
  constructor(context, logger, performanceMonitor) {
    this.context = context;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;

    // Core components (will be initialized)
    this.aiClient = null;
    this.contextManager = null;
    this.fileOps = null;
    this.indexEngine = null;
    this.cacheManager = null;

    // NOX consciousness components
    this.noxSystemPrompt = null;
    this.noxCapabilities = null;
    this.noxContextBuilder = null;

    // State management
    this.isInitialized = false;
    this.workspacePath = null;
    this.configuration = null;
  }

  /**
   * Initialize the agent controller and all core components
   */
  async initialize() {
    const timer = this.performanceMonitor.startTimer("agent_initialization");

    try {
      this.logger.info("Initializing Agent Controller...");

      // Load configuration
      await this.loadConfiguration();

      // Initialize workspace
      await this.initializeWorkspace();

      // Initialize core components
      await this.initializeCoreComponents();

      // Validate initialization
      await this.validateInitialization();

      this.isInitialized = true;
      timer.end();

      this.logger.info("Agent Controller initialized successfully");
      this.performanceMonitor.recordMetric("initialization_success", 1);
    } catch (error) {
      timer.end();
      this.logger.error("Failed to initialize Agent Controller:", error);
      this.performanceMonitor.recordMetric("initialization_failure", 1);
      throw error;
    }
  }

  /**
   * Load and validate configuration
   */
  async loadConfiguration() {
    try {
      this.configuration = vscode.workspace.getConfiguration("nox");

      // Set default values if not configured
      const aiProvider = this.configuration.get("aiProvider", "anthropic");
      const enableCaching = this.configuration.get("enableCaching", true);
      const enableTelemetry = this.configuration.get("enableTelemetry", true);
      const maxContextSize = this.configuration.get("maxContextSize", 100000);
      const logLevel = this.configuration.get("logLevel", "info");

      this.logger.info("🦊 Nox configuration loaded", {
        provider: aiProvider,
        caching: enableCaching,
        telemetry: enableTelemetry,
        maxContextSize: maxContextSize,
        logLevel: logLevel,
      });

      // Store configuration for easy access
      this.configValues = {
        aiProvider,
        enableCaching,
        enableTelemetry,
        maxContextSize,
        logLevel,
      };
    } catch (error) {
      this.logger.error("Configuration loading failed:", error);
      // Use defaults if configuration fails
      this.configValues = {
        aiProvider: "anthropic",
        enableCaching: true,
        enableTelemetry: true,
        maxContextSize: 100000,
        logLevel: "info",
      };
      this.logger.info("🦊 Using default configuration values");
    }
  }

  /**
   * Get configuration value with fallback
   */
  get(key, defaultValue = null) {
    return this.configValues ? this.configValues[key] : defaultValue;
  }

  /**
   * Initialize workspace context
   */
  async initializeWorkspace() {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;

      if (workspaceFolders && workspaceFolders.length > 0) {
        this.workspacePath = workspaceFolders[0].uri.fsPath;
        this.logger.info("Workspace detected", { path: this.workspacePath });
      } else {
        this.logger.warn(
          "No workspace folder detected - some features may be limited"
        );
      }
    } catch (error) {
      throw new Error(`Workspace initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize core components with dependency injection
   */
  async initializeCoreComponents() {
    try {
      // Import core modules (lazy loading for performance)
      const AIClient = require("./aiClient");
      const ContextManager = require("./contextManager");
      const FileOps = require("./fileOps");
      const IndexEngine = require("./indexEngine");
      const CacheManager = require("../storage/cacheManager");

      // Initialize in dependency order
      this.cacheManager = new CacheManager(this.context, this.logger);
      await this.cacheManager.initialize();

      this.aiClient = new AIClient(
        this.context,
        this.logger,
        this.performanceMonitor
      );
      await this.aiClient.initialize(this.configuration);

      this.fileOps = new FileOps(
        this.context,
        this.logger,
        this.performanceMonitor
      );
      await this.fileOps.initialize();

      this.contextManager = new ContextManager(
        this.context,
        this.logger,
        this.performanceMonitor,
        this.cacheManager
      );
      await this.contextManager.initialize();

      this.indexEngine = new IndexEngine(
        this.context,
        this.logger,
        this.performanceMonitor,
        this.contextManager
      );
      await this.indexEngine.initialize(this.workspacePath);

      // Initialize NOX consciousness components
      this.noxSystemPrompt = new NoxSystemPrompt(
        this.logger,
        this.performanceMonitor
      );
      this.noxCapabilities = new NoxCapabilities(
        this.logger,
        this.performanceMonitor
      );
      this.noxContextBuilder = new NoxContextBuilder(
        this.contextManager,
        this.indexEngine,
        this.logger,
        this.performanceMonitor
      );

      this.logger.info(
        "Core components and NOX consciousness initialized successfully"
      );
    } catch (error) {
      throw new Error(
        `Core components initialization failed: ${error.message}`
      );
    }
  }

  /**
   * Validate that all components are properly initialized
   */
  async validateInitialization() {
    const components = [
      { name: "aiClient", instance: this.aiClient },
      { name: "contextManager", instance: this.contextManager },
      { name: "fileOps", instance: this.fileOps },
      { name: "indexEngine", instance: this.indexEngine },
      { name: "cacheManager", instance: this.cacheManager },
    ];

    for (const component of components) {
      if (!component.instance || !component.instance.isInitialized) {
        throw new Error(
          `Component ${component.name} failed to initialize properly`
        );
      }
    }

    this.logger.debug("All components validated successfully");
  }

  /**
   * Handle workspace folder changes
   */
  async handleWorkspaceChange(_event) {
    try {
      this.logger.info("Handling workspace change...");

      // Reinitialize workspace
      await this.initializeWorkspace();

      // Reinitialize index engine with new workspace
      if (this.indexEngine) {
        await this.indexEngine.reinitialize(this.workspacePath);
      }

      this.logger.info("Workspace change handled successfully");
    } catch (error) {
      this.logger.error("Failed to handle workspace change:", error);
    }
  }

  /**
   * Handle file changes for intelligent indexing
   */
  async handleFileChange(document) {
    try {
      if (!this.indexEngine || !this.isInitialized) return;

      const filePath = document.uri.fsPath;
      this.logger.debug("File changed, updating index", { filePath });

      await this.indexEngine.updateFileIndex(filePath, document.getText());
    } catch (error) {
      this.logger.error("Failed to handle file change:", error);
    }
  }

  /**
   * Update configuration when settings change
   */
  async updateConfiguration() {
    try {
      this.logger.info("Updating configuration...");

      await this.loadConfiguration();

      // Update AI client configuration
      if (this.aiClient) {
        await this.aiClient.updateConfiguration(this.configuration);
      }

      this.logger.info("Configuration updated successfully");
    } catch (error) {
      this.logger.error("Failed to update configuration:", error);
    }
  }

  /**
   * Get agent status and health information
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      workspace: this.workspacePath,
      components: {
        aiClient: (this.aiClient && this.aiClient.isInitialized) || false,
        contextManager:
          (this.contextManager && this.contextManager.isInitialized) || false,
        fileOps: (this.fileOps && this.fileOps.isInitialized) || false,
        indexEngine:
          (this.indexEngine && this.indexEngine.isInitialized) || false,
        cacheManager:
          (this.cacheManager && this.cacheManager.isInitialized) || false,
        noxSystemPrompt: !!this.noxSystemPrompt,
        noxCapabilities: !!this.noxCapabilities,
        noxContextBuilder: !!this.noxContextBuilder,
      },
      noxConsciousness: {
        enabled: !!(
          this.noxSystemPrompt &&
          this.noxCapabilities &&
          this.noxContextBuilder
        ),
        sessionId: this.noxContextBuilder?.sessionId || null,
        chatHistoryLength:
          this.noxContextBuilder?.getChatHistory()?.length || 0,
        capabilityStats: this.noxCapabilities?.getCapabilityStats() || null,
      },
      performance: this.performanceMonitor.getSystemMetrics(),
      costs: this.performanceMonitor.getCostSummary(),
    };
  }

  /**
   * 🦊 Execute NOX task with full AI consciousness and capabilities
   */
  async executeTask(taskType, parameters = {}) {
    if (!this.isInitialized) {
      throw new Error("Agent controller not initialized");
    }

    const timer = this.performanceMonitor.startTimer(`nox_task_${taskType}`);

    try {
      this.logger.info(`🦊 NOX executing task: ${taskType}`, parameters);

      // 1. Build comprehensive NOX context
      const noxContext = await this.buildNoxContext(taskType, parameters);

      // 2. Create NOX-aware system prompt
      const systemPrompt = this.buildNoxSystemPrompt(taskType, noxContext);

      // 3. Build task-specific prompt with NOX identity
      const taskPrompt = this.buildNoxTaskPrompt(
        taskType,
        parameters,
        noxContext
      );

      // 4. Execute with full NOX consciousness
      const aiResponse = await this.executeNoxTask(
        systemPrompt,
        taskPrompt,
        parameters
      );

      // 5. Process response and execute NOX capabilities
      const result = await this.processNoxResult(
        taskType,
        aiResponse,
        parameters,
        noxContext
      );

      // 6. Add to chat history for context continuity
      this.addToChatHistory(
        "user",
        this.buildUserMessage(taskType, parameters),
        noxContext
      );
      this.addToChatHistory(
        "assistant",
        result.content || result.message,
        noxContext
      );

      timer.end();
      this.performanceMonitor.recordMetric(`nox_task_${taskType}_success`, 1);

      this.logger.info(
        `🦊 NOX task completed: ${taskType} (${timer.duration}ms)`
      );
      return result;
    } catch (error) {
      timer.end();
      this.performanceMonitor.recordMetric(`nox_task_${taskType}_failure`, 1);
      this.logger.error(`🦊 NOX task ${taskType} failed:`, error);
      throw error;
    }
  }

  /**
   * 🧠 Build comprehensive NOX context
   */
  async buildNoxContext(taskType, parameters) {
    return await this.noxContextBuilder.buildNoxContext(taskType, parameters);
  }

  /**
   * 🦊 Build NOX system prompt with full consciousness
   */
  buildNoxSystemPrompt(taskType, noxContext) {
    const currentProvider = this.aiClient.currentProvider;
    return this.noxSystemPrompt.buildSystemPrompt(
      taskType,
      noxContext,
      currentProvider
    );
  }

  /**
   * 🎯 Build task-specific NOX prompt
   */
  buildNoxTaskPrompt(taskType, parameters, noxContext) {
    return this.noxSystemPrompt.buildTaskPrompt(
      taskType,
      parameters,
      noxContext
    );
  }

  /**
   * 🤖 Execute NOX task with AI consciousness
   */
  async executeNoxTask(systemPrompt, taskPrompt, parameters) {
    // Send to AI with proper system/user message structure
    const response = await this.aiClient.sendRequestWithSystem(
      systemPrompt,
      taskPrompt,
      {
        maxTokens: parameters.maxTokens || 4000,
        temperature: parameters.temperature || 0.7,
      }
    );

    return response;
  }

  /**
   * 🌊 Execute NOX streaming task with AI consciousness
   */
  async executeNoxStreamingTask(systemPrompt, taskPrompt, parameters, onChunk, onComplete, abortController) {
    // Send streaming request with proper system/user message structure
    await this.aiClient.sendStreamingRequestWithSystem(
      systemPrompt,
      taskPrompt,
      {
        maxTokens: parameters.maxTokens || 4000,
        temperature: parameters.temperature || 0.7,
        messageId: parameters.messageId,
      },
      onChunk,
      onComplete,
      abortController
    );
  }

  /**
   * 🔄 Process NOX result and execute capabilities
   */
  async processNoxResult(taskType, aiResponse, parameters, noxContext) {
    const result = {
      taskType,
      parameters,
      status: "completed",
      timestamp: Date.now(),
      content: aiResponse.content,
      provider: aiResponse.provider,
      model: aiResponse.model,
      tokens: aiResponse.tokens,
      cost: aiResponse.cost,
      noxContext: {
        sessionId: noxContext.sessionId,
        contextBuildTime: noxContext.contextBuildTime,
        relevanceScore: noxContext.relevanceScore,
      },
    };

    // TODO: Add capability execution logic here
    // This will be enhanced in subsequent days to handle:
    // - File operations
    // - Terminal commands
    // - Git operations
    // - Web research

    return result;
  }

  /**
   * 💬 Add message to chat history
   */
  addToChatHistory(role, content, context) {
    this.noxContextBuilder.addChatMessage(role, content, context);
  }

  /**
   * 📝 Build user message for chat history
   */
  buildUserMessage(taskType, parameters) {
    switch (taskType) {
      case "explain":
        return `Explain this code: ${parameters.code?.substring(0, 100)}...`;
      case "refactor":
        return `Refactor this code: ${parameters.code?.substring(0, 100)}...`;
      case "analyze":
        return "Analyze the codebase";
      case "chat":
        return parameters.message || "Chat interaction";
      default:
        return `Execute ${taskType} task`;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      this.logger.info("Cleaning up Agent Controller...");

      const cleanupPromises = [];

      if (this.indexEngine) {
        cleanupPromises.push(this.indexEngine.cleanup());
      }
      if (this.contextManager) {
        cleanupPromises.push(this.contextManager.cleanup());
      }
      if (this.aiClient) {
        cleanupPromises.push(this.aiClient.cleanup());
      }
      if (this.fileOps) {
        cleanupPromises.push(this.fileOps.cleanup());
      }
      if (this.cacheManager) {
        cleanupPromises.push(this.cacheManager.cleanup());
      }

      await Promise.all(cleanupPromises);

      this.isInitialized = false;
      this.logger.info("Agent Controller cleanup completed");
    } catch (error) {
      this.logger.error("Error during Agent Controller cleanup:", error);
    }
  }
}

module.exports = AgentController;
