/**
 * 🦊 NOX Autonomy Manager
 * Manages dual-mode operation: Collaborative vs Autonomous
 */

const vscode = require("vscode");

class NoxAutonomyManager {
  constructor(logger, performanceMonitor) {
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.isInitialized = false;

    // Default settings
    this.settings = {
      autonomyLevel: "collaborative", // 'collaborative' | 'autonomous'
      gitOperations: {
        autoCommit: false,
        autoPush: false,
        autoCreateBranches: true,
        autoGenerateCommitMessages: true,
        autoStageFiles: true,
      },
      fileOperations: {
        autoCreate: true,
        autoEdit: true,
        autoDelete: false, // Always require approval for deletion
      },
      terminalOperations: {
        autoInstallPackages: false,
        autoRunBuildCommands: false,
        autoRunTests: false,
      },
      webOperations: {
        autoSearch: false,
        autoFetchDocumentation: true,
      },
      approvalSettings: {
        showRiskLevel: true,
        showPreview: true,
        requireExplicitApproval: true,
        timeoutSeconds: 30,
      },
    };

    this.init();
  }

  /**
   * 🚀 Initialize autonomy manager
   */
  async init() {
    try {
      // Load settings from VS Code configuration
      await this.loadSettings();

      this.isInitialized = true;
      this.logger.info(
        `🦊 Autonomy manager initialized - Mode: ${this.settings.autonomyLevel}`
      );
    } catch (error) {
      this.logger.warn("Failed to load settings, using defaults:", error);
      // Continue with default settings instead of throwing
      this.isInitialized = true;
    }
  }

  /**
   * 📖 Load settings from VS Code configuration
   */
  async loadSettings() {
    try {
      const config = vscode.workspace.getConfiguration("nox");

      // Load autonomy level
      this.settings.autonomyLevel = config.get(
        "autonomy.level",
        "collaborative"
      );

      // Load operation-specific settings
      this.settings.gitOperations = {
        ...this.settings.gitOperations,
        ...config.get("autonomy.git", {}),
      };

      this.settings.fileOperations = {
        ...this.settings.fileOperations,
        ...config.get("autonomy.files", {}),
      };

      this.settings.terminalOperations = {
        ...this.settings.terminalOperations,
        ...config.get("autonomy.terminal", {}),
      };

      this.settings.webOperations = {
        ...this.settings.webOperations,
        ...config.get("autonomy.web", {}),
      };

      this.settings.approvalSettings = {
        ...this.settings.approvalSettings,
        ...config.get("autonomy.approval", {}),
      };

      this.logger.debug("Settings loaded:", this.settings);
    } catch (error) {
      this.logger.warn("Failed to load settings, using defaults:", error);
    }
  }

  /**
   * 💾 Save settings to VS Code configuration
   */
  async saveSettings() {
    try {
      const config = vscode.workspace.getConfiguration("nox");

      await config.update(
        "autonomy.level",
        this.settings.autonomyLevel,
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        "autonomy.git",
        this.settings.gitOperations,
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        "autonomy.files",
        this.settings.fileOperations,
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        "autonomy.terminal",
        this.settings.terminalOperations,
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        "autonomy.web",
        this.settings.webOperations,
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        "autonomy.approval",
        this.settings.approvalSettings,
        vscode.ConfigurationTarget.Global
      );

      this.logger.info("✅ Settings saved successfully");
    } catch (error) {
      this.logger.error("Failed to save settings:", error);
      throw error;
    }
  }

  /**
   * 🎛️ Set autonomy level
   */
  async setAutonomyLevel(level) {
    if (!["collaborative", "autonomous"].includes(level)) {
      throw new Error(`Invalid autonomy level: ${level}`);
    }

    const previousLevel = this.settings.autonomyLevel;
    this.settings.autonomyLevel = level;

    // Update operation settings based on autonomy level
    this.updateOperationSettings(level);

    await this.saveSettings();

    this.logger.info(`🎛️ Autonomy level changed: ${previousLevel} → ${level}`);

    return {
      previous: previousLevel,
      current: level,
      settings: this.settings,
    };
  }

  /**
   * ⚙️ Update operation settings based on autonomy level
   */
  updateOperationSettings(level) {
    if (level === "autonomous") {
      // Autonomous mode - enable most auto operations
      this.settings.gitOperations = {
        ...this.settings.gitOperations,
        autoCommit: true,
        autoPush: true,
        autoCreateBranches: true,
        autoGenerateCommitMessages: true,
        autoStageFiles: true,
      };

      this.settings.fileOperations = {
        ...this.settings.fileOperations,
        autoCreate: true,
        autoEdit: true,
        autoDelete: false, // Still require approval for deletion
      };

      this.settings.terminalOperations = {
        ...this.settings.terminalOperations,
        autoInstallPackages: true,
        autoRunBuildCommands: true,
        autoRunTests: false, // Keep test running manual for safety
      };

      this.settings.webOperations = {
        ...this.settings.webOperations,
        autoSearch: true,
        autoFetchDocumentation: true,
      };

      this.settings.approvalSettings = {
        ...this.settings.approvalSettings,
        requireExplicitApproval: false,
        timeoutSeconds: 5, // Shorter timeout for autonomous mode
      };
    } else {
      // Collaborative mode - require approval for most operations
      this.settings.gitOperations = {
        ...this.settings.gitOperations,
        autoCommit: false,
        autoPush: false,
        autoCreateBranches: true, // Safe operation
        autoGenerateCommitMessages: true, // Helpful but safe
        autoStageFiles: false,
      };

      this.settings.fileOperations = {
        ...this.settings.fileOperations,
        autoCreate: true, // Safe operation
        autoEdit: true, // Safe operation
        autoDelete: false, // Always require approval
      };

      this.settings.terminalOperations = {
        ...this.settings.terminalOperations,
        autoInstallPackages: false,
        autoRunBuildCommands: false,
        autoRunTests: false,
      };

      this.settings.webOperations = {
        ...this.settings.webOperations,
        autoSearch: false,
        autoFetchDocumentation: true, // Safe operation
      };

      this.settings.approvalSettings = {
        ...this.settings.approvalSettings,
        requireExplicitApproval: true,
        timeoutSeconds: 30, // Longer timeout for review
      };
    }
  }

  /**
   * 🔍 Check if operation requires approval
   */
  requiresApproval(operationType, operationDetails = {}) {
    const { autonomyLevel } = this.settings;
    const { risk = "medium" } = operationDetails;

    // Always require approval for high-risk operations
    if (risk === "high") {
      return true;
    }

    // In autonomous mode, most operations don't require approval
    if (autonomyLevel === "autonomous") {
      // Still require approval for destructive operations
      const destructiveOperations = [
        "file_deletion",
        "git_force_push",
        "terminal_rm",
        "git_reset_hard",
      ];

      return destructiveOperations.includes(operationType);
    }

    // In collaborative mode, check specific operation settings
    switch (operationType) {
      case "git_commit":
        return !this.settings.gitOperations.autoCommit;
      case "git_push":
        return !this.settings.gitOperations.autoPush;
      case "git_branch_create":
        return !this.settings.gitOperations.autoCreateBranches;
      case "file_creation":
        return !this.settings.fileOperations.autoCreate;
      case "file_edit":
        return !this.settings.fileOperations.autoEdit;
      case "file_deletion":
        return true; // Always require approval
      case "package_installation":
        return !this.settings.terminalOperations.autoInstallPackages;
      case "terminal_command":
        return !this.settings.terminalOperations.autoRunBuildCommands;
      case "web_search":
        return !this.settings.webOperations.autoSearch;
      default:
        return true; // Default to requiring approval
    }
  }

  /**
   * 📊 Get current autonomy status
   */
  getStatus() {
    return {
      level: this.settings.autonomyLevel,
      isAutonomous: this.settings.autonomyLevel === "autonomous",
      isCollaborative: this.settings.autonomyLevel === "collaborative",
      settings: this.settings,
      initialized: this.isInitialized,
    };
  }

  /**
   * 🎯 Get operation-specific settings
   */
  getOperationSettings(operationType) {
    const category = this.getOperationCategory(operationType);
    return this.settings[category] || {};
  }

  /**
   * 🏷️ Get operation category
   */
  getOperationCategory(operationType) {
    if (operationType.startsWith("git_")) return "gitOperations";
    if (operationType.startsWith("file_")) return "fileOperations";
    if (operationType.startsWith("terminal_")) return "terminalOperations";
    if (operationType.startsWith("web_")) return "webOperations";
    return "approvalSettings";
  }

  /**
   * 🔄 Toggle autonomy level
   */
  async toggleAutonomyLevel() {
    const newLevel =
      this.settings.autonomyLevel === "collaborative"
        ? "autonomous"
        : "collaborative";
    return await this.setAutonomyLevel(newLevel);
  }

  /**
   * 🧹 Cleanup resources
   */
  cleanup() {
    this.logger.info("🧹 Autonomy manager cleanup completed");
  }
}

module.exports = NoxAutonomyManager;
