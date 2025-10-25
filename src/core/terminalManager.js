/**
 * 🦊 NOX Terminal Manager
 * Manages terminal command execution with output capture, autonomy checking, and safety validation
 */

const vscode = require("vscode");
const { spawn } = require("child_process");
const path = require("path");

class TerminalManager {
  constructor(logger, performanceMonitor, autonomyManager) {
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.autonomyManager = autonomyManager;
    this.isInitialized = false;

    // Terminal management
    this.terminals = new Map(); // name -> terminal
    this.commandHistory = [];
    this.maxHistorySize = 100;

    // Safety settings
    this.dangerousPatterns = [
      /rm\s+-rf/i,
      /sudo\s+/i,
      /format\s+/i,
      /dd\s+if=/i,
      /mkfs/i,
      /fdisk/i,
      /shutdown/i,
      /reboot/i,
    ];

    // Restricted commands (always require approval)
    this.restrictedCommands = [
      "npm uninstall",
      "npm remove",
      "yarn remove",
      "pnpm remove",
      "git push",
      "git reset",
      "git clean",
    ];

    this.init();
  }

  /**
   * 🚀 Initialize terminal manager
   */
  async init() {
    try {
      this.isInitialized = true;
      this.logger.info("🦊 Terminal Manager initialized");
    } catch (error) {
      this.logger.error("Failed to initialize Terminal Manager:", error);
      throw error;
    }
  }

  /**
   * 🔍 Validate command for safety
   */
  validateCommand(command) {
    if (!command || typeof command !== "string") {
      throw new Error("Invalid command: must be a non-empty string");
    }

    // Check for dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(command)) {
        throw new Error(
          `🚫 Dangerous command blocked: ${command}\n\nThis command pattern is not allowed for safety reasons.`
        );
      }
    }

    return true;
  }

  /**
   * 🎯 Check if command requires approval
   */
  requiresApproval(command) {
    // Always require approval for restricted commands
    for (const restricted of this.restrictedCommands) {
      if (command.toLowerCase().includes(restricted.toLowerCase())) {
        return true;
      }
    }

    // Check autonomy settings
    if (this.autonomyManager.settings.autonomyLevel === "collaborative") {
      return true; // Collaborative mode requires approval for all commands
    }

    // Autonomous mode - check specific settings
    if (command.toLowerCase().includes("npm install")) {
      return !this.autonomyManager.settings.terminalOperations.autoInstallPackages;
    }

    if (
      command.toLowerCase().includes("npm run build") ||
      command.toLowerCase().includes("npm run dev")
    ) {
      return !this.autonomyManager.settings.terminalOperations.autoRunBuildCommands;
    }

    if (command.toLowerCase().includes("npm test")) {
      return !this.autonomyManager.settings.terminalOperations.autoRunTests;
    }

    return false;
  }

  /**
   * ✅ Request user approval for command
   */
  async requestApproval(command) {
    const choice = await vscode.window.showInformationMessage(
      `🦊 NOX wants to run this command:\n\n\`${command}\`\n\nAllow this?`,
      "✅ Allow",
      "📋 Copy",
      "❌ Deny"
    );

    if (choice === "✅ Allow") {
      return true;
    } else if (choice === "📋 Copy") {
      await vscode.env.clipboard.writeText(command);
      return false;
    }

    return false;
  }

  /**
   * 🎮 Get or create terminal
   */
  getOrCreateTerminal(name = "NOX") {
    if (!this.terminals.has(name)) {
      const terminal = vscode.window.createTerminal(name);
      this.terminals.set(name, terminal);
      this.logger.debug(`📺 Created terminal: ${name}`);
    }

    const terminal = this.terminals.get(name);
    terminal.show();
    return terminal;
  }

  /**
   * 🚀 Execute command with output capture
   */
  async executeCommand(command, options = {}) {
    const timer = this.performanceMonitor.startTimer("terminal_command");

    try {
      // 1. Validate command
      this.validateCommand(command);
      this.logger.info(`🚀 Executing command: ${command}`);

      // 2. Check if approval needed
      const needsApproval = this.requiresApproval(command);
      if (needsApproval) {
        const approved = await this.requestApproval(command);
        if (!approved) {
          timer.end();
          return {
            success: false,
            command,
            executed: false,
            message: "User denied command execution",
          };
        }
      }

      // 3. Get or create terminal
      const terminalName = options.terminalName || "NOX";
      const terminal = this.getOrCreateTerminal(terminalName);

      // 4. Execute command
      terminal.sendText(command);

      // 5. Track in history
      this.addToHistory(command, "executed");

      timer.end();

      return {
        success: true,
        command,
        executed: true,
        terminalName,
        message: `✅ Command executed: ${command}`,
      };
    } catch (error) {
      timer.end();
      this.addToHistory(command, "failed", error.message);
      this.logger.error("Terminal command failed:", error);

      return {
        success: false,
        command,
        executed: false,
        error: error.message,
        message: `❌ Failed to execute command: ${error.message}`,
      };
    }
  }

  /**
   * 📦 Execute package installation
   */
  async installPackage(packageName, options = {}) {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    // Detect package manager
    let command = `npm install ${packageName}`;

    if (workspacePath) {
      const fs = require("fs").promises;
      try {
        await fs.access(path.join(workspacePath, "yarn.lock"));
        command = `yarn add ${packageName}`;
      } catch {
        try {
          await fs.access(path.join(workspacePath, "pnpm-lock.yaml"));
          command = `pnpm add ${packageName}`;
        } catch {
          // Default to npm
        }
      }
    }

    return this.executeCommand(command, {
      terminalName: options.terminalName || "NOX Package Manager",
    });
  }

  /**
   * 🧪 Execute test command
   */
  async runTests(options = {}) {
    const command = options.command || "npm test";
    return this.executeCommand(command, {
      terminalName: options.terminalName || "NOX Tests",
    });
  }

  /**
   * 🏗️ Execute build command
   */
  async runBuild(options = {}) {
    const command = options.command || "npm run build";
    return this.executeCommand(command, {
      terminalName: options.terminalName || "NOX Build",
    });
  }

  /**
   * 📜 Get command history
   */
  getHistory(limit = 10) {
    return this.commandHistory.slice(-limit);
  }

  /**
   * 📝 Add command to history
   */
  addToHistory(command, status, error = null) {
    this.commandHistory.push({
      command,
      status,
      error,
      timestamp: Date.now(),
    });

    // Keep history size manageable
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory.shift();
    }
  }

  /**
   * 🧹 Close terminal
   */
  closeTerminal(name) {
    const terminal = this.terminals.get(name);
    if (terminal) {
      terminal.dispose();
      this.terminals.delete(name);
      this.logger.debug(`📺 Closed terminal: ${name}`);
    }
  }

  /**
   * 🧹 Close all terminals
   */
  closeAllTerminals() {
    for (const [name, terminal] of this.terminals.entries()) {
      terminal.dispose();
    }
    this.terminals.clear();
    this.logger.info("🧹 Closed all terminals");
  }

  /**
   * 🧹 Cleanup resources
   */
  async cleanup() {
    try {
      this.closeAllTerminals();
      this.commandHistory = [];
      this.isInitialized = false;
      this.logger.info("🧹 Terminal Manager cleaned up");
    } catch (error) {
      this.logger.error("Error during Terminal Manager cleanup:", error);
    }
  }
}

module.exports = TerminalManager;

