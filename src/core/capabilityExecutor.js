const vscode = require("vscode");
const path = require("path");
const NoxCodeGenerator = require("./codeGenerator");
const NoxGitOperations = require("./gitOps");
const NoxAutonomyManager = require("./autonomyManager");
const TerminalManager = require("./terminalManager");

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

      // Initialize code generator
      this.codeGenerator = new NoxCodeGenerator(
        logger,
        performanceMonitor,
        agentController.contextManager
      );

      // Initialize Git operations
      try {
        this.gitOps = new NoxGitOperations(
          logger,
          performanceMonitor,
          agentController.contextManager
        );
        this.logger.debug("✅ Git operations initialized");
      } catch (error) {
        this.logger.warn(
          "⚠️ Git operations failed to initialize:",
          error.message
        );
        this.gitOps = null;
      }

      // Initialize autonomy manager
      try {
        this.autonomyManager = new NoxAutonomyManager(
          logger,
          performanceMonitor
        );
        this.logger.debug("✅ Autonomy manager initialized");
      } catch (error) {
        this.logger.warn(
          "⚠️ Autonomy manager failed to initialize:",
          error.message
        );
        this.autonomyManager = null;
      }

      // 🔴 PHASE 2: Initialize terminal manager
      try {
        this.terminalManager = new TerminalManager(
          logger,
          performanceMonitor,
          this.autonomyManager
        );
        this.logger.debug("✅ Terminal manager initialized");
      } catch (error) {
        this.logger.warn(
          "⚠️ Terminal manager failed to initialize:",
          error.message
        );
        this.terminalManager = null;
      }

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

      // Check if capability requires approval based on autonomy level
      const requiresApproval = this.autonomyManager
        ? this.autonomyManager.requiresApproval(capability.type, {
            risk: capability.risk || "medium",
          })
        : capability.risk && capability.risk !== "low"; // Fallback to old logic

      if (requiresApproval) {
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
            autonomyLevel: this.autonomyManager
              ? this.autonomyManager.getStatus().level
              : "unknown",
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
        case "code_generation":
          result = await this.executeCodeGeneration(capability, context);
          break;
        case "project_scaffolding":
          result = await this.executeProjectScaffolding(capability, context);
          break;
        case "multi_file_creation":
          result = await this.executeMultiFileCreation(capability, context);
          break;
        case "git_commit":
          result = await this.executeGitCommit(capability, context);
          break;
        case "git_push":
          result = await this.executeGitPush(capability, context);
          break;
        case "git_branch_create":
          result = await this.executeGitBranchCreate(capability, context);
          break;
        case "git_branch_switch":
          result = await this.executeGitBranchSwitch(capability, context);
          break;
        case "git_merge":
          result = await this.executeGitMerge(capability, context);
          break;
        case "git_status":
          result = await this.executeGitStatus(capability, context);
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
   * 🎨 Generate basic template when intelligent generation fails
   */
  generateBasicTemplate(fileName, language, requirements) {
    const ext = path.extname(fileName).toLowerCase();
    const baseName = path.basename(fileName, ext);

    // Determine language from extension if not provided
    if (!language) {
      const langMap = {
        ".js": "javascript",
        ".jsx": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".py": "python",
        ".java": "java",
        ".cpp": "cpp",
        ".c": "c",
        ".cs": "csharp",
        ".php": "php",
        ".rb": "ruby",
        ".go": "go",
        ".rs": "rust",
      };
      language = langMap[ext] || "javascript";
    }

    // Generate basic template based on file type and requirements
    if (ext === ".jsx" || ext === ".tsx") {
      return `import React from 'react';

const ${baseName} = () => {
  return (
    <div className="${baseName}">
      <h2>${baseName}</h2>
      {/* TODO: Implement ${baseName} component */}
    </div>
  );
};

export default ${baseName};
`;
    } else if (ext === ".vue") {
      return `<template>
  <div class="${baseName}">
    <h2>${baseName}</h2>
    <!-- TODO: Implement ${baseName} component -->
  </div>
</template>

<script>
export default {
  name: '${baseName}',
  data() {
    return {
      // TODO: Add component data
    };
  },
  methods: {
    // TODO: Add component methods
  }
};
</script>

<style scoped>
.${baseName} {
  /* TODO: Add component styles */
}
</style>
`;
    } else if (ext === ".py") {
      return `"""
${baseName} module
Generated by NOX 🦊
"""


class ${baseName}:
    """${baseName} class"""

    def __init__(self):
        """Initialize ${baseName}"""
        pass

    def main(self):
        """Main method"""
        # TODO: Implement main functionality
        pass


if __name__ == "__main__":
    ${baseName.toLowerCase()} = ${baseName}()
    ${baseName.toLowerCase()}.main()
`;
    } else {
      // Default JavaScript/TypeScript template
      const isTS = language === "typescript" || ext === ".ts";
      return `/**
 * ${baseName}
 * Generated by NOX 🦊
 */

${isTS ? "export " : ""}class ${baseName} {
  ${isTS ? "constructor() {" : "constructor() {"}
    // TODO: Initialize ${baseName}
  }

  ${isTS ? "main(): void {" : "main() {"}
    // TODO: Implement main functionality
  }
}

${isTS ? "" : "module.exports = " + baseName + ";"}
`;
    }
  }

  /**
   * 📄 Execute file creation capability with intelligent code generation
   */
  async executeFileCreation(capability, context) {
    try {
      const { fileName, content, language, requirements } =
        capability.parameters;

      if (!fileName) {
        throw new Error("Missing required parameter: fileName");
      }

      let finalContent = content;

      // If no content provided but requirements exist, generate intelligent code
      if (!content && requirements) {
        this.logger.info(`🎨 Generating intelligent code for: ${fileName}`);

        try {
          const generationResult = await this.codeGenerator.generateCode(
            requirements,
            context
          );

          if (generationResult.success) {
            finalContent = generationResult.code;
            this.logger.info(
              `✅ Code generated successfully using ${generationResult.metadata.strategy} strategy`
            );
          } else {
            throw new Error("Code generation failed");
          }
        } catch (genError) {
          this.logger.warn(
            `Code generation failed, using basic template: ${genError.message}`
          );
          finalContent = this.generateBasicTemplate(
            fileName,
            language,
            requirements
          );
        }
      }

      if (!finalContent) {
        throw new Error("No content provided and code generation failed");
      }

      // Resolve file path relative to workspace
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const fullPath = workspacePath
        ? path.join(workspacePath, fileName)
        : fileName;

      const result = await this.fileOps.createFile(fullPath, finalContent, {
        overwrite: false,
        createBackup: true,
      });

      return {
        success: true,
        type: "file_creation",
        result,
        message: `Successfully created file: ${fileName}`,
        generated: !!requirements && !content,
        metadata: requirements
          ? {
              strategy: "intelligent_generation",
              language: language || "javascript",
            }
          : undefined,
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

      // 🔴 PHASE 2: Use TerminalManager for real command execution
      if (!this.terminalManager) {
        throw new Error("Terminal manager not initialized");
      }

      // Execute command with TerminalManager
      const result = await this.terminalManager.executeCommand(command, {
        terminalName: "NOX Command",
      });

      return {
        success: result.success,
        type: "terminal_command",
        result,
        message: result.message,
        executed: result.executed,
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
   * 🎨 Execute code generation capability
   */
  async executeCodeGeneration(capability, context) {
    try {
      const { requirements, fileName, language } = capability.parameters;

      if (!requirements) {
        throw new Error("Missing required parameter: requirements");
      }

      this.logger.info(
        `🎨 Generating code with requirements: ${JSON.stringify(requirements)}`
      );

      const generationResult = await this.codeGenerator.generateCode(
        requirements,
        context
      );

      if (!generationResult.success) {
        throw new Error("Code generation failed");
      }

      // If fileName is provided, create the file
      if (fileName) {
        const workspacePath =
          vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const fullPath = workspacePath
          ? path.join(workspacePath, fileName)
          : fileName;

        await this.fileOps.createFile(fullPath, generationResult.code, {
          overwrite: false,
          createBackup: true,
        });

        return {
          success: true,
          type: "code_generation",
          result: {
            code: generationResult.code,
            filePath: fullPath,
            metadata: generationResult.metadata,
          },
          message: `Successfully generated and created file: ${fileName}`,
        };
      } else {
        return {
          success: true,
          type: "code_generation",
          result: {
            code: generationResult.code,
            metadata: generationResult.metadata,
          },
          message: "Code generated successfully",
        };
      }
    } catch (error) {
      return {
        success: false,
        type: "code_generation",
        error: error.message,
        message: `Failed to generate code: ${error.message}`,
      };
    }
  }

  /**
   * 🏗️ Execute project scaffolding capability
   */
  async executeProjectScaffolding(capability, context) {
    try {
      const { projectName, framework, language, features } =
        capability.parameters;

      if (!projectName) {
        throw new Error("Missing required parameter: projectName");
      }

      this.logger.info(
        `🏗️ Scaffolding project: ${projectName} with ${
          framework || "default"
        } framework`
      );

      const requirements = {
        type: "project",
        name: projectName,
        framework: framework || "vanilla",
        language: language || "javascript",
        features: features || [],
      };

      const generationResult = await this.codeGenerator.generateCode(
        requirements,
        context
      );

      if (!generationResult.success) {
        throw new Error("Project scaffolding failed");
      }

      // Create all project files
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const projectPath = workspacePath
        ? path.join(workspacePath, projectName)
        : projectName;

      const createdFiles = [];
      for (const file of generationResult.files) {
        const fullPath = path.join(projectPath, file.name);

        // Ensure directory exists
        const dir = path.dirname(fullPath);
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(dir));

        await this.fileOps.createFile(fullPath, file.content, {
          overwrite: false,
          createBackup: false,
        });

        createdFiles.push(fullPath);
      }

      return {
        success: true,
        type: "project_scaffolding",
        result: {
          projectPath,
          createdFiles,
          metadata: generationResult.metadata,
        },
        message: `Successfully scaffolded project: ${projectName} (${createdFiles.length} files created)`,
      };
    } catch (error) {
      return {
        success: false,
        type: "project_scaffolding",
        error: error.message,
        message: `Failed to scaffold project: ${error.message}`,
      };
    }
  }

  /**
   * 📁 Execute multi-file creation capability
   */
  async executeMultiFileCreation(capability, context) {
    try {
      const { files, baseDirectory } = capability.parameters;

      if (!files || !Array.isArray(files)) {
        throw new Error("Missing required parameter: files (array)");
      }

      this.logger.info(`📁 Creating ${files.length} files`);

      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const basePath = baseDirectory
        ? workspacePath
          ? path.join(workspacePath, baseDirectory)
          : baseDirectory
        : workspacePath || "";

      const createdFiles = [];
      const errors = [];

      for (const file of files) {
        try {
          let content = file.content;

          // Generate content if requirements provided but no content
          if (!content && file.requirements) {
            const generationResult = await this.codeGenerator.generateCode(
              file.requirements,
              context
            );

            if (generationResult.success) {
              content = generationResult.code;
            } else {
              content = this.generateBasicTemplate(
                file.name,
                file.language,
                file.requirements
              );
            }
          }

          const fullPath = path.join(basePath, file.name);

          // Ensure directory exists
          const dir = path.dirname(fullPath);
          await vscode.workspace.fs.createDirectory(vscode.Uri.file(dir));

          await this.fileOps.createFile(fullPath, content, {
            overwrite: false,
            createBackup: true,
          });

          createdFiles.push(fullPath);
        } catch (fileError) {
          errors.push({
            file: file.name,
            error: fileError.message,
          });
        }
      }

      return {
        success: errors.length === 0,
        type: "multi_file_creation",
        result: {
          createdFiles,
          errors,
          successCount: createdFiles.length,
          errorCount: errors.length,
        },
        message: `Created ${createdFiles.length} files${
          errors.length > 0 ? ` with ${errors.length} errors` : ""
        }`,
      };
    } catch (error) {
      return {
        success: false,
        type: "multi_file_creation",
        error: error.message,
        message: `Failed to create files: ${error.message}`,
      };
    }
  }

  /**
   * 📝 Execute Git commit capability
   */
  async executeGitCommit(capability, context) {
    try {
      const {
        files = [],
        message = null,
        autoStage = true,
      } = capability.parameters;

      this.logger.info("📝 Executing Git commit...");

      // Get current Git status
      const status = await this.gitOps.getStatus();

      if (!status.isRepo) {
        throw new Error("Current workspace is not a Git repository");
      }

      // Stage files if auto-staging is enabled
      if (autoStage) {
        await this.gitOps.stageFiles(files);
      }

      // Generate commit message if not provided
      let commitMessage = message;
      if (!commitMessage) {
        const commitInfo = await this.gitOps.generateCommitMessage(
          files.length > 0 ? files : status.changes.map((c) => c.file),
          context
        );
        commitMessage = commitInfo.message;
      }

      // Create commit
      const result = await this.gitOps.createCommit(commitMessage);

      return {
        success: true,
        type: "git_commit",
        result: {
          hash: result.hash,
          message: commitMessage,
          files: files.length > 0 ? files : status.changes.map((c) => c.file),
        },
        message: `Successfully committed changes: ${result.hash}`,
      };
    } catch (error) {
      return {
        success: false,
        type: "git_commit",
        error: error.message,
        message: `Failed to commit changes: ${error.message}`,
      };
    }
  }

  /**
   * ⬆️ Execute Git push capability
   */
  async executeGitPush(capability, context) {
    try {
      const {
        branch = null,
        remote = "origin",
        force = false,
        setUpstream = false,
      } = capability.parameters;

      this.logger.info("⬆️ Executing Git push...");

      const result = await this.gitOps.pushChanges(branch, {
        remote,
        force,
        setUpstream,
      });

      return {
        success: true,
        type: "git_push",
        result: {
          branch: result.branch,
          remote: result.remote,
        },
        message: `Successfully pushed ${result.branch} to ${result.remote}`,
      };
    } catch (error) {
      return {
        success: false,
        type: "git_push",
        error: error.message,
        message: `Failed to push changes: ${error.message}`,
      };
    }
  }

  /**
   * 🌿 Execute Git branch creation capability
   */
  async executeGitBranchCreate(capability, context) {
    try {
      const {
        branchName = null,
        baseBranch = null,
        featureDescription = null,
      } = capability.parameters;

      this.logger.info("🌿 Executing Git branch creation...");

      // Generate branch name if not provided
      let finalBranchName = branchName;
      if (!finalBranchName && featureDescription) {
        finalBranchName = this.gitOps.generateBranchName(featureDescription);
      }

      if (!finalBranchName) {
        throw new Error("Branch name or feature description is required");
      }

      const result = await this.gitOps.createBranch(
        finalBranchName,
        baseBranch
      );

      return {
        success: true,
        type: "git_branch_create",
        result: {
          name: result.name,
          base: result.base,
        },
        message: `Successfully created and switched to branch: ${result.name}`,
      };
    } catch (error) {
      return {
        success: false,
        type: "git_branch_create",
        error: error.message,
        message: `Failed to create branch: ${error.message}`,
      };
    }
  }

  /**
   * 🔄 Execute Git branch switch capability
   */
  async executeGitBranchSwitch(capability, context) {
    try {
      const { branchName } = capability.parameters;

      if (!branchName) {
        throw new Error("Branch name is required");
      }

      this.logger.info(`🔄 Switching to branch: ${branchName}`);

      const result = await this.gitOps.switchBranch(branchName);

      return {
        success: true,
        type: "git_branch_switch",
        result: {
          branch: result.branch,
        },
        message: `Successfully switched to branch: ${result.branch}`,
      };
    } catch (error) {
      return {
        success: false,
        type: "git_branch_switch",
        error: error.message,
        message: `Failed to switch branch: ${error.message}`,
      };
    }
  }

  /**
   * 🔀 Execute Git merge capability
   */
  async executeGitMerge(capability, context) {
    try {
      const {
        sourceBranch,
        targetBranch = null,
        noFastForward = false,
        squash = false,
        message = null,
      } = capability.parameters;

      if (!sourceBranch) {
        throw new Error("Source branch is required");
      }

      this.logger.info(
        `🔀 Merging ${sourceBranch} into ${targetBranch || "current branch"}`
      );

      const result = await this.gitOps.mergeBranch(sourceBranch, targetBranch, {
        noFastForward,
        squash,
        message,
      });

      return {
        success: true,
        type: "git_merge",
        result: {
          source: result.source,
          target: result.target,
        },
        message: `Successfully merged ${result.source} into ${result.target}`,
      };
    } catch (error) {
      return {
        success: false,
        type: "git_merge",
        error: error.message,
        message: `Failed to merge branches: ${error.message}`,
      };
    }
  }

  /**
   * 📊 Execute Git status capability
   */
  async executeGitStatus(capability, context) {
    try {
      this.logger.info("📊 Getting Git status...");

      const status = await this.gitOps.getStatus();

      return {
        success: true,
        type: "git_status",
        result: status,
        message: status.isRepo
          ? `Git status: ${status.changes.length} changes on ${status.branch}`
          : "Not a Git repository",
      };
    } catch (error) {
      return {
        success: false,
        type: "git_status",
        error: error.message,
        message: `Failed to get Git status: ${error.message}`,
      };
    }
  }

  /**
   * 🧹 Cleanup resources
   */
  cleanup() {
    this.pendingApprovals.clear();
    this.executionHistory = [];

    // Cleanup Git operations and autonomy manager
    try {
      if (this.gitOps && typeof this.gitOps.cleanup === "function") {
        this.gitOps.cleanup();
      }
    } catch (error) {
      this.logger.warn("Failed to cleanup Git operations:", error.message);
    }

    try {
      if (
        this.autonomyManager &&
        typeof this.autonomyManager.cleanup === "function"
      ) {
        this.autonomyManager.cleanup();
      }
    } catch (error) {
      this.logger.warn("Failed to cleanup autonomy manager:", error.message);
    }
  }
}

module.exports = CapabilityExecutor;
