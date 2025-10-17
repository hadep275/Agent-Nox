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

        // Settings panel command
        vscode.commands.registerCommand("nox.openSettingsPanel", async () => {
          await this.openSettingsPanel();
        }),

        // Toggle provider section command
        vscode.commands.registerCommand(
          "nox.toggleProviderSection",
          async () => {
            if (
              this.chatSidebarProvider &&
              this.chatSidebarProvider.webviewView
            ) {
              this.chatSidebarProvider.webviewView.webview.postMessage({
                type: "toggleProviderSection",
              });
              console.log("🦊 Toggle command sent to webview");
            } else {
              console.log("🦊 Toggle command failed - webview not available");
            }
          }
        ),

        // Individual settings commands (for submenu)
        vscode.commands.registerCommand("nox.manageApiKeys", async () => {
          await vscode.commands.executeCommand("nox.apiKeys");
        }),

        vscode.commands.registerCommand("nox.switchProvider", async () => {
          await this.showProviderSwitcher();
        }),

        vscode.commands.registerCommand("nox.showHelp", async () => {
          await this.showHelp();
        }),

        vscode.commands.registerCommand("nox.resetExtension", async () => {
          await this.resetExtension();
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
   * ⚙️ Open settings panel (like Augment)
   */
  async openSettingsPanel() {
    try {
      // Create settings panel
      const panel = vscode.window.createWebviewPanel(
        "noxSettings",
        "🦊 Nox Settings",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [this.context.extensionUri],
        }
      );

      // Set the HTML content
      panel.webview.html = this.getSettingsPanelContent();

      // Handle messages from the settings panel
      panel.webview.onDidReceiveMessage(async (message) => {
        try {
          switch (message.type) {
            case "setApiKey":
              try {
                await this.agentController.aiClient.setApiKey(
                  message.provider,
                  message.apiKey
                );

                // Verify the key was saved by trying to retrieve it
                const savedKey = await this.agentController.aiClient.getApiKey(
                  message.provider
                );
                if (savedKey) {
                  panel.webview.postMessage({
                    type: "apiKeySet",
                    provider: message.provider,
                  });
                  this.logger.info(
                    `✅ API key successfully saved for ${message.provider}`
                  );
                } else {
                  throw new Error("API key was not saved properly");
                }
              } catch (error) {
                this.logger.error(
                  `❌ Failed to save API key for ${message.provider}:`,
                  error
                );
                panel.webview.postMessage({
                  type: "error",
                  message: `Failed to save ${message.provider} API key: ${error.message}`,
                  provider: message.provider,
                });
              }
              break;
            case "switchProvider":
              await this.agentController.aiClient.setProvider(message.provider);
              panel.webview.postMessage({
                type: "providerSwitched",
                provider: message.provider,
              });
              break;
            case "getProviderStatus":
              await this.sendProviderStatus(panel.webview);
              break;
            case "openExternal":
              vscode.env.openExternal(vscode.Uri.parse(message.url));
              break;
            case "openKeybindings":
              await vscode.commands.executeCommand(
                "workbench.action.openGlobalKeybindings",
                "nox"
              );
              break;
            case "resetExtension":
              await this.resetExtension();
              break;
            case "getVoiceStatus":
              await this.sendVoiceStatus(panel.webview);
              break;
            case "setVoiceSettings":
              await this.setVoiceSettings(message.settings);
              await this.sendVoiceStatus(panel.webview);
              break;
            case "setGoogleApiKey":
              await this.setGoogleApiKey(message.apiKey);
              await this.sendVoiceStatus(panel.webview);
              break;
            case "setAzureApiKey":
              await this.setAzureApiKey(message.apiKey, message.region);
              await this.sendVoiceStatus(panel.webview);
              break;
            default:
              this.logger.warn(
                `Unknown settings message type: ${message.type}`
              );
          }
        } catch (error) {
          this.logger.error("Error handling settings message:", error);
          panel.webview.postMessage({ type: "error", message: error.message });
        }
      });

      this.logger.info("🦊 Settings panel opened");
    } catch (error) {
      this.logger.error("Error opening settings panel:", error);
      vscode.window.showErrorMessage(
        `Failed to open settings: ${error.message}`
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
   * 📄 Get settings panel HTML content
   */
  getSettingsPanelContent() {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <title>🦊 Nox Settings</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                color: var(--vscode-foreground);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
            }

            .settings-container {
                max-width: 1200px;
                margin: 0 auto;
                display: grid;
                grid-template-columns: 250px 1fr;
                gap: 30px;
                height: calc(100vh - 40px);
            }

            .settings-sidebar {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 20px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .settings-content {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 30px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow-y: auto;
            }

            .settings-nav {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .settings-nav li {
                margin-bottom: 8px;
            }

            .settings-nav button {
                width: 100%;
                background: transparent;
                border: none;
                color: var(--vscode-foreground);
                padding: 12px 16px;
                text-align: left;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
            }

            .settings-nav button:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .settings-nav button.active {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .section {
                display: none;
            }

            .section.active {
                display: block;
            }

            .section h2 {
                margin-top: 0;
                color: #64b5f6;
                font-size: 24px;
                margin-bottom: 20px;
            }

            .provider-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }

            .provider-card {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 20px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s ease;
            }

            .provider-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            }

            .provider-card h3 {
                margin-top: 0;
                color: #81c784;
                font-size: 18px;
            }

            .input-container {
                position: relative;
                margin-top: 10px;
            }

            .api-key-input {
                width: 100%;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                padding: 10px 40px 10px 10px;
                color: var(--vscode-foreground);
                font-family: 'Courier New', monospace;
                font-size: 14px;
                box-sizing: border-box;
            }

            .api-key-input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
            }

            .toggle-btn {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: var(--vscode-foreground);
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                font-size: 16px;
                opacity: 0.7;
                transition: all 0.2s ease;
            }

            .toggle-btn:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.1);
            }

            .status-indicator {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                margin-top: 8px;
            }

            .status-configured {
                background: #4caf50;
                color: white;
            }

            .status-missing {
                background: #f44336;
                color: white;
            }

            .status-error {
                background: #ff5722;
                color: white;
            }

            .status-saving {
                background: #ff9800;
                color: white;
            }

            .btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 10px;
                transition: all 0.2s ease;
            }

            .btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }

            .help-text {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin-top: 8px;
                opacity: 0.8;
            }
        </style>
    </head>
    <body>
        <div class="settings-container">
            <div class="settings-sidebar">
                <h2>🦊 Nox Settings</h2>
                <ul class="settings-nav">
                    <li><button class="nav-btn active" data-section="api-keys">🔑 API Keys</button></li>
                    <li><button class="nav-btn" data-section="voice">🎤 Voice Input</button></li>
                    <li><button class="nav-btn" data-section="theme">🎨 Theme</button></li>
                    <li><button class="nav-btn" data-section="performance">📊 Performance</button></li>
                    <li><button class="nav-btn" data-section="help">📖 Help & Documentation</button></li>
                    <li><button class="nav-btn" data-section="account">👤 Account</button></li>
                    <li><button class="nav-btn" data-section="reset">🔄 Reset Extension</button></li>
                    <li><button class="nav-btn" data-section="about">ℹ️ About</button></li>
                </ul>
            </div>

            <div class="settings-content">
                <div id="api-keys" class="section active">
                    <h2>🔑 API Keys</h2>
                    <p>Configure your AI provider API keys securely.</p>
                    <div class="provider-grid" id="apiKeysGrid">
                        <!-- API key cards will be populated here -->
                    </div>
                </div>

                <div id="voice" class="section">
                    <h2>🎤 Voice Input</h2>
                    <p>Configure voice-to-text settings for hands-free coding.</p>

                    <div class="provider-card">
                        <h3>🎤 Voice Input Settings</h3>
                        <div style="margin: 16px 0;">
                            <label style="display: flex; align-items: center; margin-bottom: 12px;">
                                <input type="checkbox" id="voiceEnabled" style="margin-right: 8px;">
                                <span>Enable voice input</span>
                            </label>
                        </div>

                        <div style="margin: 16px 0;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Voice Engine:</label>
                            <select id="voiceEngine" style="width: 100%; padding: 8px; border: 1px solid #444; background: #2a2a2a; color: #fff; border-radius: 4px;">
                                <option value="openai">🤖 OpenAI Whisper (Recommended)</option>
                                <option value="google">🌐 Google Speech</option>
                                <option value="azure">☁️ Azure Speech</option>
                                <option value="free" disabled>🆓 Vosk (Advanced Setup Required)</option>
                            </select>
                            <!-- Dynamic note that shows based on selected engine -->
                            <div id="voiceEngineNote" style="margin-top: 8px; padding: 8px; background: #1a1a1a; border-radius: 4px; font-size: 12px; color: #888; display: none;">
                                <!-- Content will be dynamically updated -->
                            </div>
                        </div>

                        <div id="googleApiKeySection" style="margin: 16px 0; display: none;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Google Cloud API Key:</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="password" id="googleApiKey" placeholder="Enter Google Cloud API key..."
                                       style="flex: 1; padding: 8px; border: 1px solid #444; background: #2a2a2a; color: #fff; border-radius: 4px;">
                                <button id="saveGoogleApiKey" class="btn">Save</button>
                            </div>
                        </div>

                        <div id="azureApiKeySection" style="margin: 16px 0; display: none;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Azure Speech API Key:</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="password" id="azureApiKey" placeholder="Enter Azure Speech API key..."
                                       style="flex: 1; padding: 8px; border: 1px solid #444; background: #2a2a2a; color: #fff; border-radius: 4px;">
                                <button id="saveAzureApiKey" class="btn">Save</button>
                            </div>
                            <div style="margin-top: 8px;">
                                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #888;">Azure Region (e.g., eastus, westus2):</label>
                                <input type="text" id="azureRegion" placeholder="eastus"
                                       style="width: 100%; padding: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff; border-radius: 4px; font-size: 12px;">
                            </div>
                        </div>

                        <div style="margin: 16px 0;">
                            <h4>Engine Status:</h4>
                            <div id="voiceEngineStatus" style="margin-top: 8px;">
                                <div style="display: flex; align-items: center; margin: 4px 0;">
                                    <span id="openaiStatus" style="margin-right: 8px;">🤖 OpenAI Whisper:</span>
                                    <span id="openaiStatusText" style="color: #f44336;">❌ No OpenAI API key</span>
                                    <span style="margin-left: 8px; font-size: 11px; color: #666;">(Set in API Keys section)</span>
                                </div>
                                <div style="display: flex; align-items: center; margin: 4px 0;">
                                    <span id="googleStatus" style="margin-right: 8px;">🌐 Google Speech:</span>
                                    <span id="googleStatusText" style="color: #f44336;">❌ No Google API key</span>
                                </div>
                                <div style="display: flex; align-items: center; margin: 4px 0;">
                                    <span id="azureStatus" style="margin-right: 8px;">☁️ Azure Speech:</span>
                                    <span id="azureStatusText" style="color: #f44336;">❌ No Azure API key</span>
                                </div>
                                <div style="display: flex; align-items: center; margin: 4px 0;">
                                    <span id="freeStatus" style="margin-right: 8px;">🆓 Vosk (Offline):</span>
                                    <span style="color: #ff9800;">⚠️ Advanced setup required</span>
                                </div>
                            </div>
                        </div>

                        <button id="saveVoiceSettings" class="btn" style="margin-top: 16px;">Save Voice Settings</button>
                    </div>
                </div>

                <div id="theme" class="section">
                    <h2>🎨 Aurora Theme</h2>
                    <p>Customize your Nox experience with beautiful Aurora themes.</p>
                    <div class="provider-grid">
                        <div class="provider-card">
                            <h3>🌌 Classic Aurora</h3>
                            <p>Default blue-purple aurora theme</p>
                            <button class="btn">Apply Theme</button>
                        </div>
                        <div class="provider-card">
                            <h3>🔥 Fire Aurora</h3>
                            <p>Warm orange-red aurora theme</p>
                            <button class="btn">Apply Theme</button>
                        </div>
                    </div>
                </div>

                <div id="performance" class="section">
                    <h2>📊 Performance Dashboard</h2>
                    <p>Monitor your Nox usage and performance metrics.</p>
                    <div class="provider-card">
                        <h3>📈 Usage Statistics</h3>
                        <p>Coming soon - detailed analytics and performance metrics</p>
                    </div>
                </div>

                <div id="help" class="section">
                    <h2>📖 Help & Documentation</h2>
                    <div class="provider-grid">
                        <div class="provider-card">
                            <h3>📚 User Guide</h3>
                            <p>Complete guide to using Nox effectively</p>
                            <button class="btn">Open User Guide</button>
                        </div>
                        <div class="provider-card">
                            <h3>⌨️ Keyboard Shortcuts</h3>
                            <p>List of all Nox commands and shortcuts</p>
                            <button class="btn" onclick="openKeybindings()">View Shortcuts</button>
                        </div>
                        <div class="provider-card">
                            <h3>🌐 Online Documentation</h3>
                            <p>Visit our comprehensive documentation website</p>
                            <button class="btn" onclick="openExternal('https://hadep275.github.io/Agent-Nox/')">Open Docs</button>
                        </div>
                        <div class="provider-card">
                            <h3>🐛 Report Issue</h3>
                            <p>Found a bug or have a feature request?</p>
                            <button class="btn" onclick="openExternal('https://github.com/hadep275/Agent-Nox/issues')">Report Issue</button>
                        </div>
                    </div>
                </div>

                <div id="account" class="section">
                    <h2>👤 Account & Preferences</h2>
                    <div class="provider-grid">
                        <div class="provider-card">
                            <h3>👤 User Profile</h3>
                            <p>Manage your Nox user preferences and profile</p>
                            <input type="text" class="api-key-input" placeholder="Display Name" value="Developer">
                            <button class="btn">Save Profile</button>
                        </div>
                        <div class="provider-card">
                            <h3>🔔 Notifications</h3>
                            <p>Configure notification preferences</p>
                            <label><input type="checkbox" checked> Enable completion notifications</label><br>
                            <label><input type="checkbox" checked> Enable error notifications</label><br>
                            <label><input type="checkbox"> Enable usage analytics</label>
                        </div>
                        <div class="provider-card">
                            <h3>💾 Data & Privacy</h3>
                            <p>Manage your data and privacy settings</p>
                            <button class="btn">Export Chat History</button>
                            <button class="btn">Privacy Settings</button>
                        </div>
                    </div>
                </div>

                <div id="reset" class="section">
                    <h2>🔄 Reset Extension</h2>
                    <div class="provider-card">
                        <h3>⚠️ Reset Nox Extension</h3>
                        <p>This will clear all data including chat history, API keys, settings, and cached data.</p>
                        <p><strong>This action cannot be undone!</strong></p>
                        <div style="margin-top: 20px;">
                            <h4>What will be reset:</h4>
                            <ul>
                                <li>• All chat conversations and history</li>
                                <li>• Stored API keys (securely deleted)</li>
                                <li>• Extension settings and preferences</li>
                                <li>• Cached data and performance metrics</li>
                                <li>• User profile and account data</li>
                            </ul>
                        </div>
                        <button class="btn" style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);" onclick="resetExtension()">
                            🔄 Reset Everything
                        </button>
                    </div>
                </div>

                <div id="about" class="section">
                    <h2>ℹ️ About Nox</h2>
                    <div class="provider-grid">
                        <div class="provider-card">
                            <h3>🦊 Nox v0.1.0</h3>
                            <p>Your clever AI coding fox</p>
                            <p>Built with ❤️ for enterprise-scale development</p>
                            <button class="btn" onclick="openExternal('https://github.com/hadep275/Agent-Nox')">GitHub Repository</button>
                        </div>
                        <div class="provider-card">
                            <h3>🏢 Enterprise Features</h3>
                            <p>Designed for large-scale codebases (100K+ files)</p>
                            <ul>
                                <li>• Multi-AI provider support</li>
                                <li>• Performance monitoring</li>
                                <li>• Audit trails & logging</li>
                                <li>• ROI tracking</li>
                            </ul>
                        </div>
                        <div class="provider-card">
                            <h3>🎨 Aurora Theme</h3>
                            <p>Beautiful Northern Lights inspired interface</p>
                            <p>Crafted for long coding sessions with eye-friendly gradients</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();

            // Navigation
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const section = btn.dataset.section;

                    // Update nav
                    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Update content
                    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                    document.getElementById(section).classList.add('active');
                });
            });

            // Initialize
            window.addEventListener('load', () => {
                vscode.postMessage({ type: 'getProviderStatus' });
                populateApiKeys();
            });

            function populateApiKeys() {
                const providers = [
                    { id: 'anthropic', name: '🤖 Anthropic Claude', placeholder: 'sk-ant-api03-...', help: 'Get your key from: https://console.anthropic.com/' },
                    { id: 'openai', name: '🧠 OpenAI GPT-4', placeholder: 'sk-...', help: 'Get your key from: https://platform.openai.com/api-keys' },
                    { id: 'deepseek', name: '🔍 DeepSeek', placeholder: 'sk-...', help: 'Get your key from: https://platform.deepseek.com/' },
                    { id: 'local', name: '🏠 Local LLM', placeholder: 'http://localhost:11434', help: 'No API key needed for local models' }
                ];

                const grid = document.getElementById('apiKeysGrid');

                // Create HTML for each provider
                let html = '';
                providers.forEach(provider => {
                    html += '<div class="provider-card">';
                    html += '<h3>' + provider.name + '</h3>';
                    html += '<div class="input-container">';
                    html += '<input type="password" class="api-key-input"';
                    html += ' placeholder="' + provider.placeholder + '"';
                    html += ' data-provider="' + provider.id + '"';
                    html += ' id="input-' + provider.id + '">';
                    html += '<button class="toggle-btn" data-provider="' + provider.id + '"';
                    html += ' id="toggle-' + provider.id + '" title="Show/Hide API Key">👁️</button>';
                    html += '</div>';
                    html += '<div class="status-indicator status-missing" id="status-' + provider.id + '">Not Configured</div>';
                    html += '<button class="btn" data-provider="' + provider.id + '" id="save-' + provider.id + '" style="margin-left: 10px;">Save Key</button>';
                    html += '<div class="help-text">' + provider.help + '</div>';
                    html += '</div>';
                });

                grid.innerHTML = html;

                // Add event listeners after creating the HTML
                setupEventListeners();

                // Request current API key status from extension
                vscode.postMessage({ type: 'getProviderStatus' });
            }

            function setupEventListeners() {
                // Add event listeners for toggle buttons
                document.querySelectorAll('.toggle-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const provider = this.getAttribute('data-provider');
                        toggleVisibility(provider);
                    });
                });

                // Add event listeners for save buttons
                document.querySelectorAll('.btn[data-provider]').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const provider = this.getAttribute('data-provider');
                        setApiKey(provider);
                    });
                });

                // Add event listeners for input changes to detect when keys are cleared
                document.querySelectorAll('.api-key-input').forEach(input => {
                    input.addEventListener('input', function() {
                        const provider = this.getAttribute('data-provider');
                        const status = document.getElementById('status-' + provider);

                        if (this.value.trim() === '') {
                            // Key was cleared, update status
                            status.textContent = 'Not Configured';
                            status.className = 'status-indicator status-missing';
                        }
                    });
                });
            }

            function toggleVisibility(provider) {
                const input = document.getElementById('input-' + provider);
                const toggleBtn = document.getElementById('toggle-' + provider);

                if (input && toggleBtn) {
                    if (input.type === 'password') {
                        input.type = 'text';
                        toggleBtn.textContent = '🙈';
                        toggleBtn.title = 'Hide API Key';
                    } else {
                        input.type = 'password';
                        toggleBtn.textContent = '👁️';
                        toggleBtn.title = 'Show API Key';
                    }
                }
            }

            function setApiKey(provider) {
                const input = document.getElementById('input-' + provider);
                const saveBtn = document.getElementById('save-' + provider);
                const statusDiv = document.getElementById('status-' + provider);

                if (!input || !saveBtn || !statusDiv) {
                    return;
                }

                const apiKey = input.value.trim();

                // Validate API key format based on provider
                const validation = validateApiKey(provider, apiKey);
                if (!validation.valid) {
                    statusDiv.textContent = validation.message;
                    statusDiv.className = 'status-indicator status-error';
                    setTimeout(() => {
                        statusDiv.textContent = 'Not Configured';
                        statusDiv.className = 'status-indicator status-missing';
                    }, 3000);
                    return;
                }

                // Update UI to show saving state
                saveBtn.textContent = 'Saving...';
                saveBtn.disabled = true;
                statusDiv.textContent = 'Saving...';
                statusDiv.className = 'status-indicator status-saving';

                // Send message to extension
                vscode.postMessage({ type: 'setApiKey', provider, apiKey });
            }

            function validateApiKey(provider, apiKey) {
                if (!apiKey) {
                    return { valid: false, message: 'API key cannot be empty' };
                }

                switch (provider) {
                    case 'anthropic':
                        if (!apiKey.startsWith('sk-ant-')) {
                            return { valid: false, message: 'Anthropic keys start with sk-ant-' };
                        }
                        if (apiKey.length < 50) {
                            return { valid: false, message: 'Anthropic key seems too short' };
                        }
                        break;

                    case 'openai':
                        if (!apiKey.startsWith('sk-')) {
                            return { valid: false, message: 'OpenAI keys start with sk-' };
                        }
                        if (apiKey.length < 40) {
                            return { valid: false, message: 'OpenAI key seems too short' };
                        }
                        break;

                    case 'deepseek':
                        if (!apiKey.startsWith('sk-')) {
                            return { valid: false, message: 'DeepSeek keys start with sk-' };
                        }
                        if (apiKey.length < 30) {
                            return { valid: false, message: 'DeepSeek key seems too short' };
                        }
                        break;

                    case 'local':
                        // For local, accept URLs or leave empty
                        if (apiKey && !apiKey.startsWith('http')) {
                            return { valid: false, message: 'Local endpoint should be a URL (http://...)' };
                        }
                        break;

                    default:
                        if (apiKey.length < 10) {
                            return { valid: false, message: 'API key seems too short' };
                        }
                }

                return { valid: true, message: 'Valid' };
            }

            function openExternal(url) {
                vscode.postMessage({ type: 'openExternal', url });
            }

            function openKeybindings() {
                vscode.postMessage({ type: 'openKeybindings' });
            }

            function resetExtension() {
                if (confirm('⚠️ Are you sure you want to reset Nox Extension?\\n\\nThis will permanently delete:\\n• All chat history\\n• API keys\\n• Settings\\n• Cached data\\n\\nThis cannot be undone!')) {
                    vscode.postMessage({ type: 'resetExtension' });
                }
            }

            // Handle messages from extension
            window.addEventListener('message', event => {
                const message = event.data;

                switch (message.type) {
                    case 'apiKeySet':
                        const status = document.getElementById('status-' + message.provider);
                        const saveBtn = document.getElementById('save-' + message.provider);
                        const input = document.getElementById('input-' + message.provider);

                        if (status && saveBtn && input) {
                            // Show success message temporarily
                            status.textContent = 'Saved Successfully! ✅';
                            status.className = 'status-indicator status-configured';

                            // Reset save button
                            saveBtn.textContent = 'Saved!';
                            saveBtn.disabled = false;

                            // Clear the input for security
                            input.value = '';
                            input.type = 'password';

                            // Reset toggle button
                            const toggleBtn = document.getElementById('toggle-' + message.provider);
                            if (toggleBtn) {
                                toggleBtn.textContent = '👁️';
                                toggleBtn.title = 'Show API Key';
                            }

                            // After 2 seconds, change to "Configured"
                            setTimeout(() => {
                                status.textContent = 'Configured ✅';
                                saveBtn.textContent = 'Save Key';
                            }, 2000);
                        }
                        break;

                    case 'error':
                        // Handle any errors from the extension
                        console.error('Extension error:', message.message);

                        // Update UI for the specific provider that had an error
                        if (message.provider) {
                            const saveBtn = document.getElementById('save-' + message.provider);
                            const status = document.getElementById('status-' + message.provider);

                            if (saveBtn) {
                                saveBtn.textContent = 'Save Key';
                                saveBtn.disabled = false;
                            }

                            if (status) {
                                status.textContent = 'Error: ' + message.message;
                                status.className = 'status-indicator status-error';

                                // Clear error message after 5 seconds
                                setTimeout(() => {
                                    status.textContent = 'Not Configured';
                                    status.className = 'status-indicator status-missing';
                                }, 5000);
                            }
                        } else {
                            // Fallback: try to find which provider had the error
                            const allProviders = ['anthropic', 'openai', 'deepseek', 'local'];
                            allProviders.forEach(provider => {
                                const saveBtn = document.getElementById('save-' + provider);
                                if (saveBtn && saveBtn.disabled) {
                                    saveBtn.textContent = 'Save Key';
                                    saveBtn.disabled = false;
                                }
                            });
                        }
                        break;

                    case 'providerStatus':
                        // Update status indicators based on current API key status
                        if (message.status) {
                            Object.keys(message.status).forEach(provider => {
                                const status = document.getElementById('status-' + provider);
                                if (status) {
                                    if (message.status[provider]) {
                                        status.textContent = 'Configured ✅';
                                        status.className = 'status-indicator status-configured';
                                    } else {
                                        status.textContent = 'Not Configured';
                                        status.className = 'status-indicator status-missing';
                                    }
                                }
                            });
                        }
                        break;

                    case 'voiceStatus':
                        // Update voice settings status
                        if (message.status) {
                            updateVoiceStatus(message.status);
                        }
                        break;
                }
            });

            // Voice Settings Functions
            function initializeVoiceSettings() {
                const voiceEngineSelect = document.getElementById('voiceEngine');
                const googleApiKeySection = document.getElementById('googleApiKeySection');
                const azureApiKeySection = document.getElementById('azureApiKeySection');

                // Show/hide API key sections and dynamic notes based on engine selection
                voiceEngineSelect.addEventListener('change', () => {
                    const selectedEngine = voiceEngineSelect.value;
                    const voiceEngineNote = document.getElementById('voiceEngineNote');

                    // Show/hide API key sections
                    googleApiKeySection.style.display = selectedEngine === 'google' ? 'block' : 'none';
                    azureApiKeySection.style.display = selectedEngine === 'azure' ? 'block' : 'none';

                    // Show dynamic note based on selected engine
                    if (selectedEngine === 'openai') {
                        voiceEngineNote.style.display = 'block';
                        voiceEngineNote.innerHTML = '<strong>💡 Recommended:</strong> Uses your existing OpenAI API key. Most accurate and cost-effective (~$0.006/minute).';
                        voiceEngineNote.style.color = '#4CAF50';
                    } else if (selectedEngine === 'google') {
                        voiceEngineNote.style.display = 'block';
                        voiceEngineNote.innerHTML = '<strong>💡 Enterprise Option:</strong> Requires separate Google Cloud API key. Enterprise-grade accuracy and reliability.';
                        voiceEngineNote.style.color = '#888';
                    } else if (selectedEngine === 'azure') {
                        voiceEngineNote.style.display = 'block';
                        voiceEngineNote.innerHTML = '<strong>💡 Microsoft Integration:</strong> Requires Azure subscription. Great for Microsoft-integrated workflows.';
                        voiceEngineNote.style.color = '#888';
                    } else if (selectedEngine === 'free') {
                        voiceEngineNote.style.display = 'block';
                        voiceEngineNote.innerHTML = '<strong>⚠️ Advanced Setup:</strong> 100% offline but requires development tools installation. <a href="#" onclick="showAdvancedGuide()" style="color: #4CAF50;">View Setup Guide</a>';
                        voiceEngineNote.style.color = '#f44336';
                    }
                });

                // Save voice settings
                document.getElementById('saveVoiceSettings').addEventListener('click', () => {
                    const enabled = document.getElementById('voiceEnabled').checked;
                    const engine = document.getElementById('voiceEngine').value;

                    vscode.postMessage({
                        type: 'setVoiceSettings',
                        settings: { enabled, engine }
                    });
                });

                // Save Google API key
                document.getElementById('saveGoogleApiKey').addEventListener('click', () => {
                    const googleApiKey = document.getElementById('googleApiKey').value;
                    if (googleApiKey.trim()) {
                        vscode.postMessage({
                            type: 'setGoogleApiKey',
                            apiKey: googleApiKey.trim()
                        });
                        document.getElementById('googleApiKey').value = '';
                    }
                });

                // Save Azure API key
                document.getElementById('saveAzureApiKey').addEventListener('click', () => {
                    const azureApiKey = document.getElementById('azureApiKey').value;
                    const azureRegion = document.getElementById('azureRegion').value;
                    if (azureApiKey.trim() && azureRegion.trim()) {
                        vscode.postMessage({
                            type: 'setAzureApiKey',
                            apiKey: azureApiKey.trim(),
                            region: azureRegion.trim()
                        });
                        document.getElementById('azureApiKey').value = '';
                        document.getElementById('azureRegion').value = '';
                    }
                });

                // Request current voice status
                vscode.postMessage({ type: 'getVoiceStatus' });
            }

            function updateVoiceStatus(status) {
                // Update checkboxes and selects
                document.getElementById('voiceEnabled').checked = status.enabled;
                document.getElementById('voiceEngine').value = status.engine;

                // Show/hide API key sections and dynamic notes
                const googleApiKeySection = document.getElementById('googleApiKeySection');
                const azureApiKeySection = document.getElementById('azureApiKeySection');
                const voiceEngineNote = document.getElementById('voiceEngineNote');

                googleApiKeySection.style.display = status.engine === 'google' ? 'block' : 'none';
                azureApiKeySection.style.display = status.engine === 'azure' ? 'block' : 'none';

                // Show dynamic note based on current engine
                if (status.engine === 'openai') {
                    voiceEngineNote.style.display = 'block';
                    if (status.engines.openai) {
                        voiceEngineNote.innerHTML = '<strong>✅ OpenAI Whisper is configured and ready to use.</strong>';
                        voiceEngineNote.style.color = '#4CAF50';
                    } else {
                        voiceEngineNote.innerHTML = '<strong>💡 Recommended:</strong> Uses your existing OpenAI API key. Most accurate and cost-effective (~$0.006/minute).';
                        voiceEngineNote.style.color = '#888';
                    }
                } else if (status.engine === 'google') {
                    voiceEngineNote.style.display = 'block';
                    if (status.engines.google) {
                        voiceEngineNote.innerHTML = '<strong>✅ Google Speech is configured and ready to use.</strong>';
                        voiceEngineNote.style.color = '#4CAF50';
                    } else {
                        voiceEngineNote.innerHTML = '<strong>💡 Enterprise Option:</strong> Requires separate Google Cloud API key. Enterprise-grade accuracy and reliability.';
                        voiceEngineNote.style.color = '#888';
                    }
                } else if (status.engine === 'azure') {
                    voiceEngineNote.style.display = 'block';
                    if (status.engines.azure) {
                        voiceEngineNote.innerHTML = '<strong>✅ Azure Speech is configured and ready to use.</strong>';
                        voiceEngineNote.style.color = '#4CAF50';
                    } else {
                        voiceEngineNote.innerHTML = '<strong>💡 Microsoft Integration:</strong> Requires Azure subscription. Great for Microsoft-integrated workflows.';
                        voiceEngineNote.style.color = '#888';
                    }
                } else if (status.engine === 'free') {
                    voiceEngineNote.style.display = 'block';
                    voiceEngineNote.innerHTML = '<strong>⚠️ Advanced Setup:</strong> 100% offline but requires development tools installation. <a href="#" onclick="showAdvancedGuide()" style="color: #4CAF50;">View Setup Guide</a>';
                    voiceEngineNote.style.color = '#f44336';
                }

                // Update engine status indicators
                const openaiStatusText = document.getElementById('openaiStatusText');
                const googleStatusText = document.getElementById('googleStatusText');
                const azureStatusText = document.getElementById('azureStatusText');

                if (status.engines.openai) {
                    openaiStatusText.textContent = '✅ Available (using OpenAI key)';
                    openaiStatusText.style.color = '#4CAF50';
                } else {
                    openaiStatusText.textContent = '❌ No OpenAI API key';
                    openaiStatusText.style.color = '#f44336';
                }

                if (status.engines.google) {
                    googleStatusText.textContent = '✅ Available';
                    googleStatusText.style.color = '#4CAF50';
                } else {
                    googleStatusText.textContent = '❌ No Google API key';
                    googleStatusText.style.color = '#f44336';
                }

                if (status.engines.azure) {
                    azureStatusText.textContent = '✅ Available';
                    azureStatusText.style.color = '#4CAF50';
                } else {
                    azureStatusText.textContent = '❌ No Azure API key';
                    azureStatusText.style.color = '#f44336';
                }
            }

            // Initialize voice settings when page loads
            window.addEventListener('load', () => {
                initializeVoiceSettings();
            });
        </script>
    </body>
    </html>`;
  }

  /**
   * 📊 Send provider status to settings panel
   */
  async sendProviderStatus(webview) {
    try {
      const providers = ["anthropic", "openai", "deepseek", "local"];
      const status = {};

      for (const provider of providers) {
        status[provider] = await this.agentController.aiClient.hasValidApiKey(
          provider
        );
      }

      webview.postMessage({ type: "providerStatus", status });
    } catch (error) {
      this.logger.error("Error sending provider status:", error);
    }
  }

  /**
   * 🎤 Send voice status to settings panel
   */
  async sendVoiceStatus(webview) {
    try {
      // Get voice settings from workspace state
      const voiceSettings = this.context.workspaceState.get(
        "nox.voiceSettings",
        {
          enabled: true,
          engine: "openai", // Default to OpenAI (recommended)
          googleApiKey: "",
          azureApiKey: "",
          azureRegion: "",
        }
      );

      // Check engine availability
      const engines = {
        openai: await this.agentController.aiClient.hasValidApiKey("openai"),
        google: !!voiceSettings.googleApiKey,
        azure: !!voiceSettings.azureApiKey,
        free: false, // Vosk requires advanced setup
      };

      const status = {
        enabled: voiceSettings.enabled,
        engine: voiceSettings.engine,
        engines: engines,
      };

      webview.postMessage({ type: "voiceStatus", status });
    } catch (error) {
      this.logger.error("Error sending voice status:", error);
    }
  }

  /**
   * 🎤 Set voice settings
   */
  async setVoiceSettings(settings) {
    try {
      // Get current settings
      const currentSettings = this.context.workspaceState.get(
        "nox.voiceSettings",
        {
          enabled: true,
          engine: "openai",
          googleApiKey: "",
          azureApiKey: "",
          azureRegion: "",
        }
      );

      // Update with new settings
      const updatedSettings = { ...currentSettings, ...settings };

      // Save to workspace state
      await this.context.workspaceState.update(
        "nox.voiceSettings",
        updatedSettings
      );

      // Update voice recording service if it exists
      if (
        this.chatSidebarProvider &&
        this.chatSidebarProvider.voiceRecordingService
      ) {
        await this.chatSidebarProvider.voiceRecordingService.updateVoiceSettings(
          updatedSettings
        );
      }

      this.logger.info("🎤 Voice settings updated:", updatedSettings);
    } catch (error) {
      this.logger.error("Error setting voice settings:", error);
      throw error;
    }
  }

  /**
   * 🎤 Set Google API key for voice
   */
  async setGoogleApiKey(apiKey) {
    try {
      // Get current settings
      const currentSettings = this.context.workspaceState.get(
        "nox.voiceSettings",
        {
          enabled: true,
          engine: "openai",
          googleApiKey: "",
          azureApiKey: "",
          azureRegion: "",
        }
      );

      // Update Google API key
      currentSettings.googleApiKey = apiKey;

      // Save to workspace state
      await this.context.workspaceState.update(
        "nox.voiceSettings",
        currentSettings
      );

      // Update voice recording service if it exists
      if (
        this.chatSidebarProvider &&
        this.chatSidebarProvider.voiceRecordingService
      ) {
        await this.chatSidebarProvider.voiceRecordingService.updateVoiceSettings(
          currentSettings
        );
      }

      this.logger.info("🎤 Google API key updated for voice");
    } catch (error) {
      this.logger.error("Error setting Google API key:", error);
      throw error;
    }
  }

  /**
   * 🎤 Set Azure API key for voice
   */
  async setAzureApiKey(apiKey, region) {
    try {
      // Get current settings
      const currentSettings = this.context.workspaceState.get(
        "nox.voiceSettings",
        {
          enabled: true,
          engine: "openai",
          googleApiKey: "",
          azureApiKey: "",
          azureRegion: "",
        }
      );

      // Update Azure API key and region
      currentSettings.azureApiKey = apiKey;
      currentSettings.azureRegion = region;

      // Save to workspace state
      await this.context.workspaceState.update(
        "nox.voiceSettings",
        currentSettings
      );

      // Update voice recording service if it exists
      if (
        this.chatSidebarProvider &&
        this.chatSidebarProvider.voiceRecordingService
      ) {
        await this.chatSidebarProvider.voiceRecordingService.updateVoiceSettings(
          currentSettings
        );
      }

      this.logger.info("🎤 Azure API key updated for voice");
    } catch (error) {
      this.logger.error("Error setting Azure API key:", error);
      throw error;
    }
  }

  /**
   * 🔐 Generate nonce for CSP
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
        await this.agentController.aiClient.setProvider(selectedProvider.id);
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
