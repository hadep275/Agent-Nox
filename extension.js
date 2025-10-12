const vscode = require("vscode");

// Import core modules
const Logger = require("./src/utils/logger");
const PerformanceMonitor = require("./src/core/performanceMonitor");
const AgentController = require("./src/core/agentController");

const ExplainCommand = require("./src/commands/explainCommand");
const RefactorCommand = require("./src/commands/refactorCommand");
const AnalyzeCommand = require("./src/commands/analyzeCommand");
const ApiKeyCommand = require("./src/commands/apiKeyCommand");
const AuditLogger = require("./src/enterprise/auditLogger");
const NoxChatViewProvider = require("./src/webview/chatSidebar");

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
    this.chatSidebarProvider = null;
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

      console.log("🦊 Step 4: Registering sidebar provider...");
      // Register sidebar provider
      await this.registerSidebarProvider();

      console.log("🦊 Step 5: Setting up event listeners...");
      // Set up event listeners
      this.setupEventListeners();

      console.log("🦊 Step 6: Marking as activated...");
      // Mark as activated
      this.isActivated = true;
      await vscode.commands.executeCommand("setContext", "nox.activated", true);

      const activationTime = Date.now() - startTime;
      console.log(`🦊 Step 7: Activation completed in ${activationTime}ms`);
      this.logger.info(
        `🦊 Nox extension activated successfully in ${activationTime}ms`
      );
      this.performanceMonitor.recordMetric("activation_time", activationTime);

      console.log("🦊 Step 8: Showing welcome message...");
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
        // Chat command (focus sidebar)
        vscode.commands.registerCommand("nox.chat", async () => {
          // Focus the Nox sidebar
          await vscode.commands.executeCommand("workbench.view.extension.nox");
        }),

        // Chat Panel command (focus sidebar chat)
        vscode.commands.registerCommand("nox.openChatPanel", async () => {
          // Focus the Nox sidebar and chat view
          await vscode.commands.executeCommand("workbench.view.extension.nox");
          await vscode.commands.executeCommand("noxChat.focus");
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

        // Clear chat command
        vscode.commands.registerCommand("nox.clearChat", async () => {
          if (this.chatSidebarProvider) {
            await this.chatSidebarProvider.clearChatHistory();
          }
        }),

        // Chat settings command (Quick Pick Menu)
        vscode.commands.registerCommand("nox.chatSettings", async () => {
          await this.showSettingsQuickPick();
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
   * Register sidebar webview provider for chat interface
   */
  async registerSidebarProvider() {
    try {
      // Create and register the chat sidebar provider
      this.chatSidebarProvider = new NoxChatViewProvider(
        this.context,
        this.agentController,
        this.logger
      );

      // Register the webview view provider
      const provider = vscode.window.registerWebviewViewProvider(
        "noxChat",
        this.chatSidebarProvider,
        {
          webviewOptions: {
            retainContextWhenHidden: true,
          },
        }
      );

      // Add to subscriptions for cleanup
      this.context.subscriptions.push(provider);

      this.logger.info("🦊 Sidebar provider registered successfully");
    } catch (error) {
      this.logger.error("Failed to register sidebar provider:", error);
      throw new Error(`Sidebar provider registration failed: ${error.message}`);
    }
  }

  /**
   * ⚙️ Show settings quick pick menu
   */
  async showSettingsQuickPick() {
    try {
      const settingsOptions = [
        {
          label: "🔑 Manage API Keys",
          description: "Configure API keys for AI providers",
          action: "apiKeys",
        },
        {
          label: "🤖 Switch AI Provider",
          description: "Change active provider (Anthropic, OpenAI, etc.)",
          action: "switchProvider",
        },
        {
          label: "⚙️ Extension Settings",
          description: "Open VS Code settings for Nox",
          action: "extensionSettings",
        },
        {
          label: "📊 Performance Dashboard",
          description: "View usage stats and metrics",
          action: "dashboard",
        },
        {
          label: "🎨 Theme Settings",
          description: "Customize Aurora theme colors",
          action: "themeSettings",
        },
        {
          label: "🔍 Debug & Logs",
          description: "View extension logs and diagnostics",
          action: "debugLogs",
        },
        {
          label: "📖 Help & Documentation",
          description: "Open help and command reference",
          action: "help",
        },
        {
          label: "🔄 Reset Extension",
          description: "Clear all data and reset to defaults",
          action: "reset",
        },
      ];

      const selectedOption = await vscode.window.showQuickPick(
        settingsOptions,
        {
          placeHolder: "🦊 Nox Settings - Choose an option",
          matchOnDescription: true,
        }
      );

      if (selectedOption) {
        await this.handleSettingsAction(selectedOption.action);
      }
    } catch (error) {
      this.logger.error("Error showing settings quick pick:", error);
      vscode.window.showErrorMessage(`Settings error: ${error.message}`);
    }
  }

  /**
   * 🎯 Handle settings action selection
   */
  async handleSettingsAction(action) {
    try {
      switch (action) {
        case "apiKeys":
          await vscode.commands.executeCommand("nox.apiKeys");
          break;

        case "switchProvider":
          await this.showProviderSwitcher();
          break;

        case "extensionSettings":
          await vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "nox"
          );
          break;

        case "dashboard":
          await vscode.commands.executeCommand("nox.dashboard");
          break;

        case "themeSettings":
          await this.showThemeSettings();
          break;

        case "debugLogs":
          await this.showDebugLogs();
          break;

        case "help":
          await this.showHelp();
          break;

        case "reset":
          await this.resetExtension();
          break;

        default:
          vscode.window.showWarningMessage(
            `Unknown settings action: ${action}`
          );
      }
    } catch (error) {
      this.logger.error(`Error handling settings action ${action}:`, error);
      vscode.window.showErrorMessage(
        `Failed to execute ${action}: ${error.message}`
      );
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
   * 🤖 Show provider switcher
   */
  async showProviderSwitcher() {
    try {
      const currentProvider =
        this.agentController.aiClient.getCurrentProvider();
      const configuredProviders =
        await this.agentController.aiClient.getConfiguredProviders();

      if (configuredProviders.length === 0) {
        vscode.window
          .showWarningMessage(
            "🔑 No API keys configured. Please set up API keys first!",
            "Set API Keys"
          )
          .then((selection) => {
            if (selection === "Set API Keys") {
              vscode.commands.executeCommand("nox.apiKeys");
            }
          });
        return;
      }

      const providerOptions = configuredProviders.map((provider) => ({
        label: `${provider.name} ${
          provider.id === currentProvider ? "(Current)" : ""
        }`,
        description: `Models: ${provider.models?.join(", ") || "Available"}`,
        id: provider.id,
        isCurrent: provider.id === currentProvider,
      }));

      const selectedProvider = await vscode.window.showQuickPick(
        providerOptions,
        {
          placeHolder: `🔄 Switch from ${currentProvider} to...`,
          matchOnDescription: true,
        }
      );

      if (selectedProvider && !selectedProvider.isCurrent) {
        await this.agentController.aiClient.setCurrentProvider(
          selectedProvider.id
        );
        vscode.window.showInformationMessage(
          `🤖 Switched to ${selectedProvider.label.replace(" (Current)", "")}`
        );
      }
    } catch (error) {
      this.logger.error("Error in provider switcher:", error);
      vscode.window.showErrorMessage(
        `Failed to switch provider: ${error.message}`
      );
    }
  }

  /**
   * 🎨 Show theme settings
   */
  async showThemeSettings() {
    const themeOptions = [
      {
        label: "🌌 Aurora Classic",
        description: "Default blue-purple aurora theme",
        theme: "classic",
      },
      {
        label: "🔥 Fire Aurora",
        description: "Warm orange-red aurora theme",
        theme: "fire",
      },
      {
        label: "🌿 Forest Aurora",
        description: "Green-teal aurora theme",
        theme: "forest",
      },
      {
        label: "🌸 Sakura Aurora",
        description: "Pink-purple cherry blossom theme",
        theme: "sakura",
      },
    ];

    const selectedTheme = await vscode.window.showQuickPick(themeOptions, {
      placeHolder: "🎨 Choose your Aurora theme",
    });

    if (selectedTheme) {
      // TODO: Implement theme switching
      vscode.window.showInformationMessage(
        `🎨 Theme switching coming soon! Selected: ${selectedTheme.label}`
      );
    }
  }

  /**
   * 🔍 Show debug logs
   */
  async showDebugLogs() {
    const logOptions = [
      {
        label: "📋 View Current Logs",
        description: "Show recent extension logs",
        action: "view",
      },
      {
        label: "📁 Open Log File",
        description: "Open log file in editor",
        action: "open",
      },
      {
        label: "🗑️ Clear Logs",
        description: "Clear all log history",
        action: "clear",
      },
      {
        label: "📊 Performance Metrics",
        description: "View performance data",
        action: "metrics",
      },
    ];

    const selectedOption = await vscode.window.showQuickPick(logOptions, {
      placeHolder: "🔍 Debug & Logs Options",
    });

    if (selectedOption) {
      switch (selectedOption.action) {
        case "view":
          // TODO: Show logs in output channel
          vscode.window.showInformationMessage("📋 Log viewing coming soon!");
          break;
        case "open":
          // TODO: Open log file
          vscode.window.showInformationMessage(
            "📁 Log file opening coming soon!"
          );
          break;
        case "clear":
          // TODO: Clear logs
          vscode.window.showInformationMessage("🗑️ Log clearing coming soon!");
          break;
        case "metrics":
          await vscode.commands.executeCommand("nox.dashboard");
          break;
      }
    }
  }

  /**
   * 📖 Show help and documentation
   */
  async showHelp() {
    const helpOptions = [
      {
        label: "📖 User Guide",
        description: "Complete guide to using Nox",
        action: "guide",
      },
      {
        label: "⌨️ Keyboard Shortcuts",
        description: "List of all Nox commands and shortcuts",
        action: "shortcuts",
      },
      {
        label: "🌐 Online Documentation",
        description: "Open documentation website",
        action: "website",
      },
      {
        label: "🐛 Report Issue",
        description: "Report a bug or request feature",
        action: "issue",
      },
      {
        label: "ℹ️ About Nox",
        description: "Version info and credits",
        action: "about",
      },
    ];

    const selectedOption = await vscode.window.showQuickPick(helpOptions, {
      placeHolder: "📖 Help & Documentation",
    });

    if (selectedOption) {
      switch (selectedOption.action) {
        case "guide":
          vscode.window.showInformationMessage("📖 User guide coming soon!");
          break;
        case "shortcuts":
          await vscode.commands.executeCommand(
            "workbench.action.openGlobalKeybindings",
            "nox"
          );
          break;
        case "website":
          vscode.env.openExternal(
            vscode.Uri.parse("https://hadep275.github.io/Agent-Nox/")
          );
          break;
        case "issue":
          vscode.env.openExternal(
            vscode.Uri.parse("https://github.com/hadep275/Agent-Nox/issues")
          );
          break;
        case "about":
          vscode.window.showInformationMessage(
            "🦊 Nox v0.1.0 - Your clever AI coding fox\n\nBuilt with ❤️ for enterprise-scale development"
          );
          break;
      }
    }
  }

  /**
   * 🔄 Reset extension
   */
  async resetExtension() {
    const confirmation = await vscode.window.showWarningMessage(
      "🔄 Reset Nox Extension?\n\nThis will clear all data including:\n• Chat history\n• API keys\n• Settings\n• Cached data\n\nThis cannot be undone!",
      { modal: true },
      "Reset Everything",
      "Cancel"
    );

    if (confirmation === "Reset Everything") {
      try {
        // Clear workspace state
        const keys = this.context.workspaceState.keys();
        for (const key of keys) {
          if (key.startsWith("nox.")) {
            await this.context.workspaceState.update(key, undefined);
          }
        }

        // Clear global state
        const globalKeys = this.context.globalState.keys();
        for (const key of globalKeys) {
          if (key.startsWith("nox.")) {
            await this.context.globalState.update(key, undefined);
          }
        }

        // Clear secrets (API keys)
        const providers = ["anthropic", "openai", "deepseek", "local"];
        for (const provider of providers) {
          try {
            await this.context.secrets.delete(`nox.${provider}.apiKey`);
          } catch (error) {
            // Ignore if key doesn't exist
          }
        }

        vscode.window
          .showInformationMessage(
            "🔄 Nox has been reset! Please reload VS Code to complete the reset.",
            "Reload Now"
          )
          .then((selection) => {
            if (selection === "Reload Now") {
              vscode.commands.executeCommand("workbench.action.reloadWindow");
            }
          });

        this.logger.info("🔄 Extension reset completed");
      } catch (error) {
        this.logger.error("Error resetting extension:", error);
        vscode.window.showErrorMessage(
          `Failed to reset extension: ${error.message}`
        );
      }
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
          await vscode.commands.executeCommand("nox.openChatPanel");
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
