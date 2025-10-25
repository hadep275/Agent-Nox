/**
 * 🦊 NOX Git Operations Engine
 * Enterprise-grade Git operations with intelligent automation
 */

const vscode = require("vscode");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

class NoxGitOperations {
  constructor(logger, performanceMonitor, contextManager) {
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.contextManager = contextManager;
    this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    this.isInitialized = false;

    this.init();
  }

  /**
   * 🚀 Initialize Git operations
   */
  async init() {
    try {
      if (!this.workspaceRoot) {
        throw new Error("No workspace folder found");
      }

      // Check if Git is available
      await this.execGit("--version");

      // Check if current directory is a Git repository
      try {
        await this.execGit("rev-parse --git-dir");
        this.isGitRepo = true;
      } catch (error) {
        this.isGitRepo = false;
        this.logger.warn("Current workspace is not a Git repository");
      }

      this.isInitialized = true;
      this.logger.info("🦊 Git operations engine initialized");
    } catch (error) {
      this.logger.error("Failed to initialize Git operations:", error);
      throw error;
    }
  }

  /**
   * 🔧 Execute Git command
   */
  async execGit(command, options = {}) {
    const fullCommand = `git ${command}`;
    const execOptions = {
      cwd: this.workspaceRoot,
      ...options,
    };

    this.logger.debug(`Executing Git command: ${fullCommand}`);

    try {
      const { stdout, stderr } = await execAsync(fullCommand, execOptions);

      if (stderr && !stderr.includes("warning")) {
        this.logger.warn(`Git command warning: ${stderr}`);
      }

      return stdout.trim();
    } catch (error) {
      this.logger.error(`Git command failed: ${fullCommand}`, error);
      throw new Error(`Git operation failed: ${error.message}`);
    }
  }

  /**
   * 📊 Get current Git status
   */
  async getStatus() {
    if (!this.isGitRepo) {
      return {
        isRepo: false,
        branch: null,
        changes: [],
        ahead: 0,
        behind: 0,
      };
    }

    try {
      const [branch, statusOutput, aheadBehind] = await Promise.all([
        this.getCurrentBranch(),
        this.execGit("status --porcelain"),
        this.getAheadBehind(),
      ]);

      const changes = this.parseStatusOutput(statusOutput);

      return {
        isRepo: true,
        branch,
        changes,
        ahead: aheadBehind.ahead,
        behind: aheadBehind.behind,
        hasChanges: changes.length > 0,
        hasStaged: changes.some((c) => c.staged),
        hasUnstaged: changes.some((c) => c.unstaged),
      };
    } catch (error) {
      this.logger.error("Failed to get Git status:", error);
      throw error;
    }
  }

  /**
   * 🌿 Get current branch name
   */
  async getCurrentBranch() {
    try {
      return await this.execGit("branch --show-current");
    } catch (error) {
      // Fallback for detached HEAD
      try {
        const sha = await this.execGit("rev-parse --short HEAD");
        return `detached@${sha}`;
      } catch (fallbackError) {
        return "unknown";
      }
    }
  }

  /**
   * 📈 Get ahead/behind count
   */
  async getAheadBehind() {
    try {
      const output = await this.execGit(
        "rev-list --count --left-right @{upstream}...HEAD"
      );
      const [behind, ahead] = output.split("\t").map(Number);
      return { ahead: ahead || 0, behind: behind || 0 };
    } catch (error) {
      // No upstream or other error
      return { ahead: 0, behind: 0 };
    }
  }

  /**
   * 📝 Parse Git status output
   */
  parseStatusOutput(statusOutput) {
    if (!statusOutput) return [];

    return statusOutput.split("\n").map((line) => {
      const staged = line[0] !== " " && line[0] !== "?";
      const unstaged = line[1] !== " ";
      const status = line.substring(0, 2);
      const file = line.substring(3);

      return {
        file,
        status,
        staged,
        unstaged,
        isNew: status.includes("?"),
        isModified: status.includes("M"),
        isDeleted: status.includes("D"),
        isRenamed: status.includes("R"),
        isCopied: status.includes("C"),
      };
    });
  }

  /**
   * 🎨 Generate intelligent commit message
   */
  async generateCommitMessage(files, context = {}) {
    const timer = this.performanceMonitor.startTimer(
      "commit_message_generation"
    );

    try {
      this.logger.info("🎨 Generating intelligent commit message...");

      // Analyze the changes
      const analysis = await this.analyzeChanges(files, context);

      // Determine commit type and scope
      const commitType = this.determineCommitType(analysis);
      const scope = this.determineScope(analysis);
      const description = this.generateDescription(analysis);

      // Build conventional commit message
      const message = scope
        ? `${commitType}(${scope}): ${description}`
        : `${commitType}: ${description}`;

      timer.end();

      this.logger.info(`✅ Generated commit message: "${message}"`);
      return {
        message,
        type: commitType,
        scope,
        description,
        analysis,
      };
    } catch (error) {
      timer.end();
      this.logger.error("Failed to generate commit message:", error);

      // Fallback to simple message
      return {
        message: `update: modify ${files.length} file${
          files.length > 1 ? "s" : ""
        }`,
        type: "update",
        scope: null,
        description: `modify ${files.length} file${
          files.length > 1 ? "s" : ""
        }`,
        analysis: { patterns: [], complexity: "low" },
      };
    }
  }

  /**
   * 🔍 Analyze code changes
   */
  async analyzeChanges(files, context) {
    const analysis = {
      patterns: [],
      complexity: "low",
      domains: [],
      operations: [],
    };

    for (const file of files) {
      // Analyze file patterns
      const fileAnalysis = this.analyzeFile(file);
      analysis.patterns.push(...fileAnalysis.patterns);
      analysis.domains.push(...fileAnalysis.domains);
      analysis.operations.push(...fileAnalysis.operations);
    }

    // Remove duplicates and determine overall complexity
    analysis.patterns = [...new Set(analysis.patterns)];
    analysis.domains = [...new Set(analysis.domains)];
    analysis.operations = [...new Set(analysis.operations)];

    // Determine complexity
    if (files.length > 5 || analysis.patterns.includes("breaking")) {
      analysis.complexity = "high";
    } else if (files.length > 2 || analysis.patterns.includes("refactor")) {
      analysis.complexity = "medium";
    }

    return analysis;
  }

  /**
   * 📁 Analyze individual file
   */
  analyzeFile(file) {
    const analysis = {
      patterns: [],
      domains: [],
      operations: [],
    };

    const fileName = file.toLowerCase();
    const ext = path.extname(fileName);

    // Detect patterns from file name and path
    if (fileName.includes("test") || fileName.includes("spec")) {
      analysis.patterns.push("test");
    }

    if (fileName.includes("component") || ext === ".jsx" || ext === ".tsx") {
      analysis.patterns.push("component");
      analysis.domains.push("ui");
    }

    if (fileName.includes("api") || fileName.includes("service")) {
      analysis.patterns.push("api");
      analysis.domains.push("backend");
    }

    if (fileName.includes("auth") || fileName.includes("login")) {
      analysis.domains.push("auth");
    }

    if (fileName.includes("config") || fileName.includes("setting")) {
      analysis.patterns.push("config");
    }

    if (fileName.includes("doc") || ext === ".md") {
      analysis.patterns.push("docs");
    }

    // Detect operations
    if (file.status?.includes("A")) {
      analysis.operations.push("add");
    } else if (file.status?.includes("M")) {
      analysis.operations.push("modify");
    } else if (file.status?.includes("D")) {
      analysis.operations.push("delete");
    }

    return analysis;
  }

  /**
   * 🏷️ Determine commit type
   */
  determineCommitType(analysis) {
    const { patterns, operations } = analysis;

    // Priority order for commit types
    if (patterns.includes("breaking")) return "feat!";
    if (patterns.includes("test")) return "test";
    if (patterns.includes("docs")) return "docs";
    if (patterns.includes("config")) return "chore";
    if (patterns.includes("refactor")) return "refactor";
    if (patterns.includes("component") || patterns.includes("api")) {
      return operations.includes("add") ? "feat" : "fix";
    }

    // Default based on operations
    if (operations.includes("add")) return "feat";
    if (operations.includes("delete")) return "refactor";

    return "fix"; // Default
  }

  /**
   * 🎯 Determine commit scope
   */
  determineScope(analysis) {
    const { domains, patterns } = analysis;

    // Priority order for scopes
    if (domains.includes("auth")) return "auth";
    if (domains.includes("ui")) return "ui";
    if (domains.includes("backend")) return "api";
    if (patterns.includes("test")) return "test";
    if (patterns.includes("docs")) return "docs";
    if (patterns.includes("config")) return "config";

    return null; // No specific scope
  }

  /**
   * 📝 Generate commit description
   */
  generateDescription(analysis) {
    const { patterns, domains, operations } = analysis;

    // Build description based on analysis
    let description = "";

    if (operations.includes("add")) {
      if (patterns.includes("component")) {
        description = `add ${
          domains.includes("auth") ? "authentication" : "new"
        } component`;
      } else if (patterns.includes("api")) {
        description = `add ${
          domains.includes("auth") ? "authentication" : "new"
        } API endpoints`;
      } else if (patterns.includes("test")) {
        description = "add unit tests";
      } else {
        description = "add new features";
      }
    } else if (operations.includes("modify")) {
      if (patterns.includes("component")) {
        description = "update component functionality";
      } else if (patterns.includes("api")) {
        description = "improve API endpoints";
      } else if (patterns.includes("test")) {
        description = "update test cases";
      } else {
        description = "improve functionality";
      }
    } else if (operations.includes("delete")) {
      description = "remove unused code";
    } else {
      description = "update codebase";
    }

    return description;
  }

  /**
   * 📝 Stage files for commit
   */
  async stageFiles(files = []) {
    try {
      if (files.length === 0) {
        // Stage all changes
        await this.execGit("add .");
        this.logger.info("✅ Staged all changes");
      } else {
        // Stage specific files
        const fileList = files.map((f) => `"${f}"`).join(" ");
        await this.execGit(`add ${fileList}`);
        this.logger.info(`✅ Staged ${files.length} files`);
      }

      return { success: true, stagedFiles: files };
    } catch (error) {
      this.logger.error("Failed to stage files:", error);
      throw error;
    }
  }

  /**
   * 💾 Create commit
   */
  async createCommit(message, options = {}) {
    const timer = this.performanceMonitor.startTimer("git_commit");

    try {
      const { author = null, allowEmpty = false, signOff = false } = options;

      let commitCommand = `commit -m "${message}"`;

      if (author) {
        commitCommand += ` --author="${author}"`;
      }

      if (allowEmpty) {
        commitCommand += " --allow-empty";
      }

      if (signOff) {
        commitCommand += " --signoff";
      }

      const result = await this.execGit(commitCommand);

      timer.end();

      // Extract commit hash from result
      const commitHash = await this.execGit("rev-parse --short HEAD");

      this.logger.info(`✅ Created commit: ${commitHash} - "${message}"`);

      return {
        success: true,
        hash: commitHash,
        message,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      timer.end();
      this.logger.error("Failed to create commit:", error);
      throw error;
    }
  }

  /**
   * 🌿 Create new branch
   */
  async createBranch(branchName, baseBranch = null) {
    try {
      // Validate branch name
      if (!this.isValidBranchName(branchName)) {
        throw new Error(`Invalid branch name: ${branchName}`);
      }

      // Check if branch already exists
      try {
        await this.execGit(`rev-parse --verify ${branchName}`);
        throw new Error(`Branch ${branchName} already exists`);
      } catch (error) {
        // Branch doesn't exist, which is what we want
      }

      let createCommand = `checkout -b ${branchName}`;

      if (baseBranch) {
        createCommand += ` ${baseBranch}`;
      }

      await this.execGit(createCommand);

      this.logger.info(`✅ Created and switched to branch: ${branchName}`);

      return {
        success: true,
        name: branchName,
        base: baseBranch || (await this.getCurrentBranch()),
        created: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error("Failed to create branch:", error);
      throw error;
    }
  }

  /**
   * 🔄 Switch to branch
   */
  async switchBranch(branchName) {
    try {
      await this.execGit(`checkout ${branchName}`);

      this.logger.info(`✅ Switched to branch: ${branchName}`);

      return {
        success: true,
        branch: branchName,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error("Failed to switch branch:", error);
      throw error;
    }
  }

  /**
   * ⬆️ Push changes to remote
   */
  async pushChanges(branch = null, options = {}) {
    const timer = this.performanceMonitor.startTimer("git_push");

    try {
      const { force = false, setUpstream = false, remote = "origin" } = options;

      const currentBranch = branch || (await this.getCurrentBranch());

      let pushCommand = `push ${remote} ${currentBranch}`;

      if (setUpstream) {
        pushCommand = `push -u ${remote} ${currentBranch}`;
      }

      if (force) {
        pushCommand += " --force";
      }

      await this.execGit(pushCommand);

      timer.end();

      this.logger.info(`✅ Pushed ${currentBranch} to ${remote}`);

      return {
        success: true,
        branch: currentBranch,
        remote,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      timer.end();
      this.logger.error("Failed to push changes:", error);
      throw error;
    }
  }

  /**
   * 🔀 Merge branch
   */
  async mergeBranch(sourceBranch, targetBranch = null, options = {}) {
    const timer = this.performanceMonitor.startTimer("git_merge");

    try {
      const { noFastForward = false, squash = false, message = null } = options;

      const currentBranch = await this.getCurrentBranch();
      const target = targetBranch || currentBranch;

      // Switch to target branch if needed
      if (currentBranch !== target) {
        await this.switchBranch(target);
      }

      let mergeCommand = `merge ${sourceBranch}`;

      if (noFastForward) {
        mergeCommand += " --no-ff";
      }

      if (squash) {
        mergeCommand += " --squash";
      }

      if (message) {
        mergeCommand += ` -m "${message}"`;
      }

      await this.execGit(mergeCommand);

      timer.end();

      this.logger.info(`✅ Merged ${sourceBranch} into ${target}`);

      return {
        success: true,
        source: sourceBranch,
        target,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      timer.end();
      this.logger.error("Failed to merge branch:", error);
      throw error;
    }
  }

  /**
   * ✅ Validate branch name
   */
  isValidBranchName(name) {
    // Git branch name rules
    const invalidChars = /[~^:?*[\\\s]/;
    const invalidPatterns = /^[.-]|[.-]$|\.\.|\/{2,}|@{/;

    return (
      !invalidChars.test(name) && !invalidPatterns.test(name) && name.length > 0
    );
  }

  /**
   * 🏷️ Generate branch name from feature description
   */
  generateBranchName(feature, context = {}) {
    const {
      prefix = "feature",
      maxLength = 50,
      includeTicket = false,
      ticketNumber = null,
    } = context;

    // Clean and format feature name
    let branchName = feature
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Remove multiple hyphens
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

    // Add ticket number if provided
    if (includeTicket && ticketNumber) {
      branchName = `${ticketNumber}-${branchName}`;
    }

    // Add prefix
    branchName = `${prefix}/${branchName}`;

    // Truncate if too long
    if (branchName.length > maxLength) {
      branchName = branchName.substring(0, maxLength).replace(/-[^-]*$/, "");
    }

    return branchName;
  }

  /**
   * 🧹 Cleanup resources
   */
  cleanup() {
    this.logger.info("🧹 Git operations cleanup completed");
  }
}

module.exports = NoxGitOperations;
