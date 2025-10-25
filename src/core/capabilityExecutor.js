const vscode = require("vscode");
const path = require("path");

/**
 * 🦊 NOX Capability Executor - Executes AI-suggested capabilities with user approval
 * Provides safe execution of file operations, terminal commands, and other AI suggestions
 */
class CapabilityExecutor {
  constructor(agentController, fileOps, logger, performanceMonitor) {
    try {
      // Validate required dependencies
      if (!agentController) {
        throw new Error("AgentController is required");
      }
      if (!fileOps) {
        throw new Error("FileOps is required");
      }
      if (!logger) {
        throw new Error("Logger is required");
      }
      if (!performanceMonitor) {
        throw new Error("PerformanceMonitor is required");
      }

      this.agentController = agentController;
      this.fileOps = fileOps;
      this.logger = logger;
      this.performanceMonitor = performanceMonitor;

      // Execution tracking
      this.pendingApprovals = new Map(); // capabilityId -> capability details
      this.executionHistory = [];
      this.maxHistorySize = 100;

      // Mark as initialized
      this.isInitialized = true;

      this.logger.debug("🚀 CapabilityExecutor initialized successfully");
    } catch (error) {
      this.isInitialized = false;
      if (logger) {
        logger.error("Failed to initialize CapabilityExecutor:", error);
      }
      throw error;
    }
  }

  /**
   * 🚀 Execute capability with appropriate approval flow
   */
  async executeCapability(capability, context = {}) {
    const timer = this.performanceMonitor.startTimer("capability_execution");
    const capabilityId = this.generateCapabilityId();

    try {
      this.logger.info(`🚀 Executing capability: ${capability.type}`);

      // Check if capability requires approval
      if (capability.risk && capability.risk !== "low") {
        const approved = await this.requestUserApproval(
          capability,
          capabilityId
        );
        if (!approved) {
          return {
            success: false,
            reason: "user_declined",
            capabilityId,
            message: "User declined to execute this capability",
          };
        }
      }

      // Execute based on capability type
      let result;
      switch (capability.type) {
        case "file_creation":
          result = await this.executeFileCreation(capability, context);
          break;
        case "file_edit":
          result = await this.executeFileEdit(capability, context);
          break;
        case "file_deletion":
          result = await this.executeFileDeletion(capability, context);
          break;
        case "terminal_command":
          result = await this.executeTerminalCommand(capability, context);
          break;
        case "package_installation":
          result = await this.executePackageInstallation(capability, context);
          break;
        default:
          result = await this.executeGenericCapability(capability, context);
      }

      // Record execution
      this.recordExecution(capabilityId, capability, result, context);

      timer.end();
      result.executionTime = timer.duration;
      result.capabilityId = capabilityId;

      this.logger.info(
        `🚀 Capability executed: ${capability.type} (${timer.duration}ms)`
      );
      return result;
    } catch (error) {
      timer.end();
      this.logger.error(
        `Failed to execute capability ${capability.type}:`,
        error
      );

      const errorResult = {
        success: false,
        reason: "execution_error",
        error: error.message,
        capabilityId,
        executionTime: timer.duration,
      };

      this.recordExecution(capabilityId, capability, errorResult, context);
      return errorResult;
    }
  }

  /**
   * 🔐 Request user approval for capability execution
   */
  async requestUserApproval(capability, capabilityId) {
    try {
      const riskLevel = capability.risk || "medium";
      const riskEmoji =
        {
          low: "🟢",
          medium: "🟡",
          high: "🔴",
        }[riskLevel] || "🟡";

      const message = `${riskEmoji} NOX wants to execute: ${
        capability.description
      }\n\nRisk Level: ${riskLevel.toUpperCase()}\n\nDo you approve?`;

      const choice = await vscode.window.showWarningMessage(
        message,
        { modal: true },
        "✅ Approve",
        "❌ Decline",
        "📋 View Details"
      );

      if (choice === "📋 View Details") {
        // Show detailed information
        const details = this.formatCapabilityDetails(capability);
        await vscode.window.showInformationMessage(
          details,
          { modal: true },
          "OK"
        );

        // Ask again after showing details
        return await this.requestUserApproval(capability, capabilityId);
      }

      const approved = choice === "✅ Approve";

      if (approved) {
        this.pendingApprovals.set(capabilityId, {
          capability,
          approvedAt: Date.now(),
          approvedBy: "user",
        });
      }

      return approved;
    } catch (error) {
      this.logger.error("Failed to request user approval:", error);
      return false; // Default to not approved on error
    }
  }

  /**
   * 📄 Execute file creation capability
   */
  async executeFileCreation(capability, context) {
    try {
      const { fileName, content, language } = capability.parameters;

      if (!fileName || !content) {
        throw new Error("Missing required parameters for file creation");
      }

      // Resolve file path relative to workspace
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const fullPath = workspacePath
        ? path.join(workspacePath, fileName)
        : fileName;

      const result = await this.fileOps.createFile(fullPath, content, {
        overwrite: false,
        createBackup: true,
      });

      return {
        success: true,
        type: "file_creation",
        result,
        message: `Successfully created file: ${fileName}`,
      };
    } catch (error) {
      return {
        success: false,
        type: "file_creation",
        error: error.message,
        message: `Failed to create file: ${error.message}`,
      };
    }
  }

  /**
   * ✏️ Execute file edit capability
   */
  async executeFileEdit(capability, context) {
    try {
      const { fileName, originalCode, refactoredCode, language } =
        capability.parameters;

      if (!fileName || !refactoredCode) {
        throw new Error("Missing required parameters for file edit");
      }

      // For now, we'll create a new file with the refactored code
      // In a more advanced implementation, we'd do intelligent merging
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const fullPath = workspacePath
        ? path.join(workspacePath, fileName)
        : fileName;

      // Create backup first
      const backupPath = `${fullPath}.backup.${Date.now()}`;
      await this.fileOps.copyFile(fullPath, backupPath);

      // Apply the edit (replace entire file for now)
      const edits = [
        {
          range: new vscode.Range(0, 0, Number.MAX_VALUE, 0),
          text: refactoredCode,
        },
      ];

      const result = await this.fileOps.editFile(fullPath, edits, {
        createBackup: true,
      });

      return {
        success: true,
        type: "file_edit",
        result,
        backupPath,
        message: `Successfully applied refactoring to: ${fileName}`,
      };
    } catch (error) {
      return {
        success: false,
        type: "file_edit",
        error: error.message,
        message: `Failed to edit file: ${error.message}`,
      };
    }
  }

  /**
   * 🗑️ Execute file deletion capability
   */
  async executeFileDeletion(capability, context) {
    try {
      const { fileName } = capability.parameters;

      if (!fileName) {
        throw new Error("Missing required parameters for file deletion");
      }

      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const fullPath = workspacePath
        ? path.join(workspacePath, fileName)
        : fileName;

      const result = await this.fileOps.deleteFile(fullPath, {
        createBackup: true,
      });

      return {
        success: true,
        type: "file_deletion",
        result,
        message: `Successfully deleted file: ${fileName}`,
      };
    } catch (error) {
      return {
        success: false,
        type: "file_deletion",
        error: error.message,
        message: `Failed to delete file: ${error.message}`,
      };
    }
  }

  /**
   * ⚡ Execute terminal command capability
   */
  async executeTerminalCommand(capability, context) {
    try {
      const { command } = capability.parameters;

      if (!command) {
        throw new Error("Missing command parameter");
      }

      // For now, we'll show the command to the user instead of executing it
      // In a more advanced implementation, we'd have a secure terminal execution system
      const choice = await vscode.window.showInformationMessage(
        `NOX suggests running this command:\n\n${command}\n\nWould you like to open a terminal to run it manually?`,
        "Open Terminal",
        "Copy Command",
        "Cancel"
      );

      if (choice === "Open Terminal") {
        const terminal = vscode.window.createTerminal("NOX Command");
        terminal.show();
        terminal.sendText(`# NOX suggested command:\n# ${command}`);

        return {
          success: true,
          type: "terminal_command",
          message: `Opened terminal with suggested command: ${command}`,
        };
      } else if (choice === "Copy Command") {
        await vscode.env.clipboard.writeText(command);

        return {
          success: true,
          type: "terminal_command",
          message: `Copied command to clipboard: ${command}`,
        };
      }

      return {
        success: false,
        type: "terminal_command",
        message: "User cancelled command execution",
      };
    } catch (error) {
      return {
        success: false,
        type: "terminal_command",
        error: error.message,
        message: `Failed to execute terminal command: ${error.message}`,
      };
    }
  }

  /**
   * 📦 Execute package installation capability
   */
  async executePackageInstallation(capability, context) {
    try {
      const { package: packageName } = capability.parameters;

      if (!packageName) {
        throw new Error("Missing package parameter");
      }

      // Detect package manager and suggest appropriate command
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
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

      // Use terminal command execution
      return await this.executeTerminalCommand(
        {
          parameters: { command },
        },
        context
      );
    } catch (error) {
      return {
        success: false,
        type: "package_installation",
        error: error.message,
        message: `Failed to install package: ${error.message}`,
      };
    }
  }

  /**
   * 🔧 Execute generic capability
   */
  async executeGenericCapability(capability, context) {
    // For capabilities we don't have specific handlers for
    return {
      success: false,
      type: capability.type,
      message: `Capability type '${capability.type}' not yet implemented`,
      suggestion: "This capability requires manual implementation",
    };
  }

  /**
   * 📋 Format capability details for user display
   */
  formatCapabilityDetails(capability) {
    const details = [
      `🦊 NOX Capability Details`,
      ``,
      `Type: ${capability.type}`,
      `Description: ${capability.description}`,
      `Risk Level: ${capability.risk || "medium"}`,
      `Action: ${capability.action}`,
      ``,
    ];

    if (capability.parameters) {
      details.push(`Parameters:`);
      for (const [key, value] of Object.entries(capability.parameters)) {
        details.push(`  ${key}: ${value}`);
      }
    }

    return details.join("\n");
  }

  /**
   * 📊 Record capability execution
   */
  recordExecution(capabilityId, capability, result, context) {
    const execution = {
      id: capabilityId,
      capability,
      result,
      context,
      timestamp: Date.now(),
      success: result.success,
    };

    this.executionHistory.push(execution);

    // Limit history size
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }

    // Clean up pending approvals
    this.pendingApprovals.delete(capabilityId);

    this.performanceMonitor.recordMetric(
      `capability_${capability.type}_${result.success ? "success" : "failure"}`,
      1
    );
  }

  /**
   * 🆔 Generate unique capability ID
   */
  generateCapabilityId() {
    return `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 📊 Get execution statistics
   */
  getStats() {
    const successful = this.executionHistory.filter((e) => e.success).length;
    const failed = this.executionHistory.filter((e) => !e.success).length;

    return {
      totalExecutions: this.executionHistory.length,
      successful,
      failed,
      successRate:
        this.executionHistory.length > 0
          ? successful / this.executionHistory.length
          : 0,
      pendingApprovals: this.pendingApprovals.size,
      recentExecutions: this.executionHistory.slice(-10),
    };
  }

  /**
   * 🧹 Cleanup resources
   */
  cleanup() {
    this.pendingApprovals.clear();
    this.executionHistory = [];
  }
}

module.exports = CapabilityExecutor;
