const vscode = require("vscode");
const fs = require("fs").promises;
const path = require("path");

/**
 * 🦊 Enterprise Index Engine for high-performance codebase indexing
 * Provides fast recursive scanning, incremental indexing, and large codebase support
 */
class IndexEngine {
  constructor(context, logger, performanceMonitor, contextManager) {
    this.context = context;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.contextManager = contextManager;
    this.isInitialized = false;
    this.workspacePath = null;

    // Indexing state
    this.indexingInProgress = false;
    this.indexingQueue = [];
    this.lastIndexTime = null;
    this.indexStats = {
      totalFiles: 0,
      indexedFiles: 0,
      skippedFiles: 0,
      errors: 0,
      lastIndexDuration: 0,
    };

    // File watchers
    this.fileWatchers = [];
    this.watcherDisposables = [];

    // Configuration
    this.batchSize = 50; // Process files in batches
    this.maxConcurrency = 5; // Max concurrent file operations
    this.indexingDelay = 1000; // Delay before starting indexing (ms)

    // Performance tracking
    this.indexingTimer = null;
  }

  /**
   * Initialize index engine
   */
  async initialize(workspacePath) {
    try {
      this.logger.info("🦊 Initializing Index Engine...");
      this.workspacePath = workspacePath;

      if (!workspacePath) {
        this.logger.warn("⚠️ No workspace path provided - indexing disabled");
        this.isInitialized = true;
        return;
      }

      // Setup file watchers for incremental indexing
      await this.setupFileWatchers();

      // Start initial indexing (async)
      this.scheduleIndexing("initial");

      this.isInitialized = true;
      this.logger.info("🦊 Index Engine initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize Index Engine:", error);
      throw error;
    }
  }

  /**
   * 👀 Setup file watchers for incremental indexing
   */
  async setupFileWatchers() {
    try {
      // Watch for file changes
      const fileWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(this.workspacePath, "**/*"),
        false, // Don't ignore creates
        false, // Don't ignore changes
        false // Don't ignore deletes
      );

      // File created
      fileWatcher.onDidCreate(async (uri) => {
        this.logger.debug(`📄 File created: ${uri.fsPath}`);
        await this.queueFileForIndexing(uri.fsPath, "create");
      });

      // File changed
      fileWatcher.onDidChange(async (uri) => {
        this.logger.debug(`📝 File changed: ${uri.fsPath}`);
        await this.queueFileForIndexing(uri.fsPath, "change");
      });

      // File deleted
      fileWatcher.onDidDelete(async (uri) => {
        this.logger.debug(`🗑️ File deleted: ${uri.fsPath}`);
        await this.removeFileFromIndex(uri.fsPath);
      });

      this.fileWatchers.push(fileWatcher);
      this.watcherDisposables.push(fileWatcher);

      this.logger.debug("👀 File watchers setup completed");
    } catch (error) {
      this.logger.error("Failed to setup file watchers:", error);
    }
  }

  /**
   * 📅 Schedule indexing operation
   */
  scheduleIndexing(reason = "manual", delay = null) {
    if (this.indexingInProgress) {
      this.logger.debug("Indexing already in progress, skipping schedule");
      return;
    }

    const actualDelay = delay || this.indexingDelay;

    this.logger.debug(
      `📅 Scheduling indexing in ${actualDelay}ms (reason: ${reason})`
    );

    setTimeout(async () => {
      await this.performFullIndexing(reason);
    }, actualDelay);
  }

  /**
   * 🔍 Perform full workspace indexing
   */
  async performFullIndexing(reason = "manual") {
    if (this.indexingInProgress) {
      this.logger.debug("Indexing already in progress");
      return;
    }

    if (!this.workspacePath) {
      this.logger.warn("No workspace path available for indexing");
      return;
    }

    this.indexingInProgress = true;
    this.indexingTimer = this.performanceMonitor.startTimer("full_indexing");

    try {
      this.logger.info(`🔍 Starting full workspace indexing (${reason})...`);

      // Reset stats
      this.indexStats = {
        totalFiles: 0,
        indexedFiles: 0,
        skippedFiles: 0,
        errors: 0,
        lastIndexDuration: 0,
      };

      // Scan workspace and collect files
      const files = await this.scanWorkspaceFiles();
      this.indexStats.totalFiles = files.length;

      this.logger.info(`📊 Found ${files.length} files to index`);

      // Process files in batches
      await this.processBatches(files);

      // Complete indexing
      this.indexingTimer.end();
      this.indexStats.lastIndexDuration = this.indexingTimer.duration;
      this.lastIndexTime = Date.now();

      this.logger.info(
        `🔍 Full indexing completed in ${this.indexingTimer.duration}ms`
      );
      this.logger.info(
        `📊 Stats: ${this.indexStats.indexedFiles} indexed, ${this.indexStats.skippedFiles} skipped, ${this.indexStats.errors} errors`
      );

      // Record metrics
      this.performanceMonitor.recordMetric(
        "indexing_duration",
        this.indexingTimer.duration
      );
      this.performanceMonitor.recordMetric(
        "files_indexed",
        this.indexStats.indexedFiles
      );
      this.performanceMonitor.recordMetric(
        "indexing_errors",
        this.indexStats.errors
      );
    } catch (error) {
      this.indexingTimer?.end();
      this.logger.error("Full indexing failed:", error);
      this.indexStats.errors++;
    } finally {
      this.indexingInProgress = false;
    }
  }

  /**
   * 📁 Scan workspace for files
   */
  async scanWorkspaceFiles() {
    const files = [];

    try {
      await this.scanDirectory(this.workspacePath, files);
    } catch (error) {
      this.logger.error("Failed to scan workspace files:", error);
    }

    return files;
  }

  /**
   * 📂 Recursively scan directory
   */
  async scanDirectory(dirPath, files, depth = 0) {
    if (depth > 15) {
      // Prevent excessive recursion
      this.logger.warn(`Max depth reached for directory: ${dirPath}`);
      return;
    }

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Use context manager's exclusion logic
        if (this.contextManager.shouldExclude(entry.name, fullPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, files, depth + 1);
        } else if (entry.isFile()) {
          // Use context manager's file filtering
          if (this.contextManager.shouldIndexFile(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      this.logger.debug(`Failed to scan directory ${dirPath}:`, error);
    }
  }

  /**
   * 🔄 Process files in batches
   */
  async processBatches(files) {
    const batches = [];

    // Split files into batches
    for (let i = 0; i < files.length; i += this.batchSize) {
      batches.push(files.slice(i, i + this.batchSize));
    }

    this.logger.debug(
      `🔄 Processing ${batches.length} batches of up to ${this.batchSize} files each`
    );

    // Process batches sequentially to avoid overwhelming the system
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      this.logger.debug(
        `🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} files)`
      );

      try {
        await this.processBatch(batch);
      } catch (error) {
        this.logger.error(`Failed to process batch ${i + 1}:`, error);
        this.indexStats.errors++;
      }

      // Small delay between batches to prevent blocking
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
  }

  /**
   * 📦 Process a single batch of files
   */
  async processBatch(files) {
    // Process files with limited concurrency
    const promises = [];
    const semaphore = new Array(this.maxConcurrency).fill(null);

    for (const filePath of files) {
      const promise = this.processFile(filePath);
      promises.push(promise);

      // Limit concurrency
      if (promises.length >= this.maxConcurrency) {
        await Promise.race(promises);
        // Remove completed promises
        for (let i = promises.length - 1; i >= 0; i--) {
          if (promises[i].isResolved) {
            promises.splice(i, 1);
          }
        }
      }
    }

    // Wait for remaining promises
    await Promise.allSettled(promises);
  }

  /**
   * 📄 Process a single file
   */
  async processFile(filePath) {
    try {
      // Check if file still exists
      const stats = await fs.stat(filePath);

      // Skip very large files
      if (stats.size > this.contextManager.maxFileSize) {
        this.logger.debug(
          `Skipping large file: ${filePath} (${stats.size} bytes)`
        );
        this.indexStats.skippedFiles++;
        return;
      }

      // Read and index file
      const content = await fs.readFile(filePath, "utf8");
      await this.contextManager.updateFileIndex(filePath, content);

      this.indexStats.indexedFiles++;
    } catch (error) {
      this.logger.debug(`Failed to process file ${filePath}:`, error);
      this.indexStats.errors++;
    }
  }

  /**
   * 📝 Queue file for incremental indexing
   */
  async queueFileForIndexing(filePath, operation) {
    try {
      // Add to queue
      this.indexingQueue.push({
        filePath,
        operation,
        timestamp: Date.now(),
      });

      // Process queue with debouncing
      this.debounceQueueProcessing();
    } catch (error) {
      this.logger.error(
        `Failed to queue file for indexing ${filePath}:`,
        error
      );
    }
  }

  /**
   * ⏱️ Debounced queue processing
   */
  debounceQueueProcessing() {
    if (this.queueProcessingTimer) {
      clearTimeout(this.queueProcessingTimer);
    }

    this.queueProcessingTimer = setTimeout(async () => {
      await this.processIndexingQueue();
    }, 500); // 500ms debounce
  }

  /**
   * 🔄 Process indexing queue
   */
  async processIndexingQueue() {
    if (this.indexingQueue.length === 0) {
      return;
    }

    const queue = [...this.indexingQueue];
    this.indexingQueue = [];

    this.logger.debug(`🔄 Processing indexing queue: ${queue.length} items`);

    // Group by file path to avoid duplicate processing
    const fileMap = new Map();
    for (const item of queue) {
      fileMap.set(item.filePath, item); // Latest operation wins
    }

    // Process unique files
    for (const [filePath, item] of fileMap.entries()) {
      try {
        if (item.operation === "delete") {
          await this.removeFileFromIndex(filePath);
        } else {
          await this.processFile(filePath);
        }
      } catch (error) {
        this.logger.error(`Failed to process queued file ${filePath}:`, error);
      }
    }
  }

  /**
   * 🗑️ Remove file from index
   */
  async removeFileFromIndex(filePath) {
    try {
      // Remove from context manager's index
      if (this.contextManager.fileIndex.has(filePath)) {
        this.contextManager.fileIndex.delete(filePath);

        // Update symbol index
        for (const [
          symbolName,
          locations,
        ] of this.contextManager.symbolIndex.entries()) {
          const filtered = locations.filter((loc) => loc.file !== filePath);
          if (filtered.length === 0) {
            this.contextManager.symbolIndex.delete(symbolName);
          } else {
            this.contextManager.symbolIndex.set(symbolName, filtered);
          }
        }

        this.logger.debug(`🗑️ Removed file from index: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to remove file from index ${filePath}:`, error);
    }
  }

  /**
   * Reinitialize with new workspace
   */
  async reinitialize(workspacePath) {
    try {
      this.logger.info("🔄 Reinitializing Index Engine for new workspace...");

      // Cleanup current state
      await this.cleanup();

      // Initialize with new workspace
      await this.initialize(workspacePath);

      this.logger.info("🔄 Index Engine reinitialized successfully");
    } catch (error) {
      this.logger.error("Failed to reinitialize Index Engine:", error);
      throw error;
    }
  }

  /**
   * Update file index (called by agent controller)
   */
  async updateFileIndex(filePath, content) {
    try {
      if (!this.isInitialized) {
        return;
      }

      // Update through context manager
      await this.contextManager.updateFileIndex(filePath, content);

      this.logger.debug(
        `📝 File index updated: ${path.relative(
          this.workspacePath || "",
          filePath
        )}`
      );
    } catch (error) {
      this.logger.error(`Failed to update file index for ${filePath}:`, error);
    }
  }

  /**
   * 📊 Get indexing statistics
   */
  getStats() {
    return {
      ...this.indexStats,
      isIndexing: this.indexingInProgress,
      lastIndexTime: this.lastIndexTime,
      queueSize: this.indexingQueue.length,
      workspacePath: this.workspacePath,
      contextStats: this.contextManager.getStats(),
    };
  }

  /**
   * 🔍 Force reindexing
   */
  async forceReindex() {
    if (this.indexingInProgress) {
      this.logger.warn("Indexing already in progress, cannot force reindex");
      return false;
    }

    this.logger.info("🔍 Forcing complete reindex...");
    await this.performFullIndexing("forced");
    return true;
  }

  /**
   * ⏸️ Pause indexing
   */
  pauseIndexing() {
    this.indexingPaused = true;
    this.logger.info("⏸️ Indexing paused");
  }

  /**
   * ▶️ Resume indexing
   */
  resumeIndexing() {
    this.indexingPaused = false;
    this.logger.info("▶️ Indexing resumed");

    // Process any queued items
    if (this.indexingQueue.length > 0) {
      this.debounceQueueProcessing();
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      this.logger.info("Cleaning up Index Engine...");

      // Clear timers
      if (this.queueProcessingTimer) {
        clearTimeout(this.queueProcessingTimer);
        this.queueProcessingTimer = null;
      }

      // Dispose file watchers
      for (const disposable of this.watcherDisposables) {
        disposable.dispose();
      }
      this.watcherDisposables = [];
      this.fileWatchers = [];

      // Clear state
      this.indexingQueue = [];
      this.indexingInProgress = false;
      this.isInitialized = false;

      this.logger.info("Index Engine cleanup completed");
    } catch (error) {
      this.logger.error("Error during Index Engine cleanup:", error);
    }
  }
}

module.exports = IndexEngine;
