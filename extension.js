const vscode = require("vscode");

// Import core modules
const Logger = require("./src/utils/logger");
const PerformanceMonitor = require("./src/core/performanceMonitor");
const AgentController = require("./src/core/agentController");
const ChatCommand = require("./src/commands/chatCommand");
const ExplainCommand = require("./src/commands/explainCommand");
const RefactorCommand = require("./src/commands/refactorCommand");
const AnalyzeCommand = require("./src/commands/analyzeCommand");
const ApiKeyCommand = require("./src/commands/apiKeyCommand");
const AuditLogger = require("./src/enterprise/auditLogger");
const ChatPanel = require("./src/webview/chatPanel_simple");

/**
 * 🦊 Nox - AI Coding Fox VS Code Extension
 * Your clever AI companion for enterprise-scale development
 */
class NoxExtension {
  constructor() {
    this.context = null;
    this.logger = null;
    this.performanceMonitor = null;
    this.agentController = null;
    this.auditLogger = null;
    this.isActivated = false;
  }

  /**
   * Extension activation - called when VS Code starts or extension is activated
   */
  async activate(context) {
    const startTime = Date.now();

    try {
      console.log("🦊 Step 1: Setting context...");
      this.context = context;

      console.log("🦊 Step 2: Initializing core services...");
      // Initialize core services
      await this.initializeCore();

      console.log("🦊 Step 3: Registering commands...");
      // Register commands
      await this.registerCommands();

      console.log("🦊 Step 4: Setting up event listeners...");
      // Set up event listeners
      this.setupEventListeners();

      console.log("🦊 Step 5: Marking as activated...");
      // Mark as activated
      this.isActivated = true;
      await vscode.commands.executeCommand("setContext", "nox.activated", true);

      const activationTime = Date.now() - startTime;
      console.log(`🦊 Step 6: Activation completed in ${activationTime}ms`);
      this.logger.info(
        `🦊 Nox extension activated successfully in ${activationTime}ms`
      );
      this.performanceMonitor.recordMetric("activation_time", activationTime);

      console.log("🦊 Step 7: Showing welcome message...");
      // Show welcome message for first-time users
      await this.showWelcomeMessage();
    } catch (error) {
      this.logger.error("Failed to activate Agent extension:", error);
      vscode.window.showErrorMessage(
        `Agent extension failed to activate: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Initialize core services with error handling
   */
  async initializeCore() {
    try {
      console.log("🦊 Core Step 1: Creating logger...");
      // Initialize logger first
      this.logger = new Logger(this.context);
      this.logger.info("Initializing Nox extension core services...");

      console.log("🦊 Core Step 2: Creating performance monitor...");
      // Initialize performance monitoring
      this.performanceMonitor = new PerformanceMonitor(
        this.context,
        this.logger
      );

      console.log("🦊 Core Step 3: Creating audit logger...");
      // Initialize audit logging
      this.auditLogger = new AuditLogger(this.context, this.logger);

      console.log("🦊 Core Step 4: Creating agent controller...");
      // Initialize main agent controller
      this.agentController = new AgentController(
        this.context,
        this.logger,
        this.performanceMonitor
      );

      console.log("🦊 Core Step 5: Initializing agent controller...");
      await this.agentController.initialize();

      console.log("🦊 Core Step 6: Core services initialized!");
      this.logger.info("Core services initialized successfully");
    } catch (error) {
      console.error("🦊 Core initialization failed:", error);
      if (this.logger) {
        this.logger.error("Failed to initialize core services:", error);
      }
      throw new Error(`Core initialization failed: ${error.message}`);
    }
  }

  /**
   * Register all VS Code commands
   */
  async registerCommands() {
    try {
      const commands = [
        // Chat command (legacy)
        vscode.commands.registerCommand("nox.chat", async () => {
          const chatCommand = new ChatCommand(
            this.agentController,
            this.logger
          );
          return await chatCommand.execute();
        }),

        // Chat Panel command (new webview interface)
        vscode.commands.registerCommand("nox.openChatPanel", async () => {
          ChatPanel.createOrShow(
            this.context,
            this.agentController,
            this.logger
          );
        }),

        // Explain code command
        vscode.commands.registerCommand("nox.explain", async () => {
          const explainCommand = new ExplainCommand(
            this.agentController,
            this.logger
          );
          return await explainCommand.execute();
        }),

        // Refactor code command
        vscode.commands.registerCommand("nox.refactor", async () => {
          const refactorCommand = new RefactorCommand(
            this.agentController,
            this.logger
          );
          return await refactorCommand.execute();
        }),

        // Analyze codebase command
        vscode.commands.registerCommand("nox.analyze", async () => {
          const analyzeCommand = new AnalyzeCommand(
            this.agentController,
            this.logger
          );
          return await analyzeCommand.execute();
        }),

        // Performance dashboard command
        vscode.commands.registerCommand("nox.dashboard", async () => {
          return await this.showDashboard();
        }),

        // Settings command
        vscode.commands.registerCommand("nox.settings", async () => {
          return await this.showSettings();
        }),

        // API Key management command
        vscode.commands.registerCommand("nox.apiKeys", async () => {
          const apiKeyCommand = new ApiKeyCommand(
            this.context,
            this.logger,
            this.agentController.aiClient
          );
          return await apiKeyCommand.execute();
        }),
      ];

      // Register all commands with context
      commands.forEach((command) => {
        this.context.subscriptions.push(command);
      });

      this.logger.info(`Registered ${commands.length} commands successfully`);
    } catch (error) {
      this.logger.error("Failed to register commands:", error);
      throw new Error(`Command registration failed: ${error.message}`);
    }
  }

  /**
   * Set up event listeners for workspace changes, file operations, etc.
   */
  setupEventListeners() {
    try {
      // Workspace change events
      const workspaceWatcher = vscode.workspace.onDidChangeWorkspaceFolders(
        async (event) => {
          this.logger.info("Workspace folders changed, reinitializing...");
          await this.agentController.handleWorkspaceChange(event);
        }
      );

      // File change events for intelligent indexing
      const fileWatcher = vscode.workspace.onDidSaveTextDocument(
        async (document) => {
          await this.agentController.handleFileChange(document);
        }
      );

      // Configuration change events
      const configWatcher = vscode.workspace.onDidChangeConfiguration(
        async (event) => {
          if (event.affectsConfiguration("agent")) {
            this.logger.info("Agent configuration changed, updating...");
            await this.agentController.updateConfiguration();
          }
        }
      );

      // Register watchers for cleanup
      this.context.subscriptions.push(
        workspaceWatcher,
        fileWatcher,
        configWatcher
      );

      this.logger.info("Event listeners set up successfully");
    } catch (error) {
      this.logger.error("Failed to set up event listeners:", error);
    }
  }

  /**
   * Show welcome message for new users
   */
  async showWelcomeMessage() {
    const hasShownWelcome = this.context.globalState.get(
      "nox.hasShownWelcome",
      false
    );

    if (!hasShownWelcome) {
      const action = await vscode.window.showInformationMessage(
        "🦊 Welcome to Nox! Your clever AI coding fox is ready to help.",
        "Start Chat",
        "View Dashboard",
        "Settings"
      );

      switch (action) {
        case "Start Chat":
          await vscode.commands.executeCommand("nox.chat");
          break;
        case "View Dashboard":
          await vscode.commands.executeCommand("nox.dashboard");
          break;
        case "Settings":
          await vscode.commands.executeCommand("nox.settings");
          break;
      }

      await this.context.globalState.update("nox.hasShownWelcome", true);
    }
  }

  /**
   * Show performance dashboard
   */
  async showDashboard() {
    // TODO: Implement dashboard panel
    vscode.window.showInformationMessage("Dashboard coming soon!");
  }

  /**
   * Show settings panel
   */
  async showSettings() {
    // TODO: Implement settings panel
    vscode.window.showInformationMessage("Settings coming soon!");
  }

  /**
   * Extension deactivation cleanup
   */
  async deactivate() {
    try {
      if (this.agentController) {
        await this.agentController.cleanup();
      }

      if (this.performanceMonitor) {
        await this.performanceMonitor.cleanup();
      }

      if (this.logger) {
        this.logger.info("Agent extension deactivated");
        await this.logger.cleanup();
      }
    } catch (error) {
      console.error("Error during extension deactivation:", error);
    }
  }
}

// Global extension instance
let extensionInstance = null;

/**
 * VS Code extension activation entry point
 */
async function activate(context) {
  console.log("🦊 Nox extension is being activated...");
  console.log("🦊 Extension context:", context.extensionPath);

  try {
    // Show immediate feedback
    vscode.window.showInformationMessage("🦊 Nox extension is loading...");

    extensionInstance = new NoxExtension();
    await extensionInstance.activate(context);

    // Show success message
    vscode.window.showInformationMessage(
      "🦊 Nox extension activated successfully! Try Ctrl+Shift+P and type 'Nox'"
    );

    console.log("🦊 Nox extension activation completed successfully!");
  } catch (error) {
    console.error("🦊 Nox extension activation failed:", error);
    vscode.window.showErrorMessage(
      `🦊 Nox activation failed: ${error.message}`
    );
  }
}

/**
 * VS Code extension deactivation entry point
 */
async function deactivate() {
  if (extensionInstance) {
    await extensionInstance.deactivate();
    extensionInstance = null;
  }
}

module.exports = {
  activate,
  deactivate,
};
