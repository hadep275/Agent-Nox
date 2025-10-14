const vscode = require("vscode");
const fs = require("fs").promises;
const path = require("path");

/**
 * 🦊 Enterprise File Operations with atomic operations and rollback
 * Provides safe multi-file editing capabilities with enterprise-grade error handling
 */
class FileOps {
  constructor(context, logger, performanceMonitor) {
    this.context = context;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.isInitialized = false;

    // Operation tracking
    this.activeOperations = new Map(); // operationId -> operation details
    this.backupStorage = new Map(); // filePath -> backup content
    this.operationHistory = []; // History of completed operations

    // Configuration
    this.maxBackupSize = 10 * 1024 * 1024; // 10MB max backup size
    this.maxHistorySize = 100; // Keep last 100 operations
  }

  /**
   * Initialize file operations
   */
  async initialize() {
    try {
      this.logger.info("🦊 Initializing File Operations...");

      // Setup workspace edit capabilities
      this.workspaceEdit = vscode.workspace;

      // Initialize backup storage
      await this.initializeBackupStorage();

      this.isInitialized = true;
      this.logger.info("🦊 File Operations initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize File Operations:", error);
      throw error;
    }
  }

  /**
   * 💾 Initialize backup storage
   */
  async initializeBackupStorage() {
    try {
      // Clear old backups on startup
      this.backupStorage.clear();
      this.logger.debug("📁 Backup storage initialized");
    } catch (error) {
      this.logger.error("Failed to initialize backup storage:", error);
    }
  }

  /**
   * 📝 Create a new file with content
   */
  async createFile(filePath, content, options = {}) {
    if (!this.isInitialized) {
      throw new Error("File Operations not initialized");
    }

    const timer = this.performanceMonitor.startTimer("file_create");
    const operationId = this.generateOperationId();

    try {
      this.logger.info(`📝 Creating file: ${filePath}`);

      // Check if file already exists
      const uri = vscode.Uri.file(filePath);
      try {
        await vscode.workspace.fs.stat(uri);
        if (!options.overwrite) {
          throw new Error(`File already exists: ${filePath}`);
        }
      } catch (error) {
        // File doesn't exist, which is what we want for creation
        if (error.code !== "FileNotFound") {
          throw error;
        }
      }

      // Create workspace edit
      const edit = new vscode.WorkspaceEdit();
      edit.createFile(uri, { overwrite: options.overwrite || false });

      if (content) {
        edit.insert(uri, new vscode.Position(0, 0), content);
      }

      // Track operation
      this.activeOperations.set(operationId, {
        type: "create",
        files: [filePath],
        timestamp: Date.now(),
        edit,
      });

      // Apply edit
      const success = await vscode.workspace.applyEdit(edit);

      if (!success) {
        throw new Error(`Failed to create file: ${filePath}`);
      }

      // Complete operation
      this.completeOperation(operationId, "create", [filePath]);
      timer.end();

      this.logger.info(`📝 File created successfully: ${filePath}`);
      return { success: true, filePath, operationId };
    } catch (error) {
      timer.end();
      this.failOperation(operationId, error);
      this.logger.error(`Failed to create file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * ✏️ Edit file content with atomic operations
   */
  async editFile(filePath, edits, options = {}) {
    if (!this.isInitialized) {
      throw new Error("File Operations not initialized");
    }

    const timer = this.performanceMonitor.startTimer("file_edit");
    const operationId = this.generateOperationId();

    try {
      this.logger.info(`✏️ Editing file: ${filePath}`);

      const uri = vscode.Uri.file(filePath);

      // Create backup if requested
      if (options.createBackup !== false) {
        await this.createBackup(filePath);
      }

      // Create workspace edit
      const edit = new vscode.WorkspaceEdit();

      // Apply edits (edits should be array of {range, text})
      for (const editItem of edits) {
        if (editItem.range) {
          // Replace text in range
          edit.replace(uri, editItem.range, editItem.text || "");
        } else if (editItem.position) {
          // Insert text at position
          edit.insert(uri, editItem.position, editItem.text || "");
        } else if (editItem.line !== undefined) {
          // Replace entire line
          const lineRange = new vscode.Range(
            new vscode.Position(editItem.line, 0),
            new vscode.Position(editItem.line + 1, 0)
          );
          edit.replace(uri, lineRange, editItem.text + "\n");
        }
      }

      // Track operation
      this.activeOperations.set(operationId, {
        type: "edit",
        files: [filePath],
        timestamp: Date.now(),
        edit,
        backupCreated: options.createBackup !== false,
      });

      // Apply edit
      const success = await vscode.workspace.applyEdit(edit);

      if (!success) {
        throw new Error(`Failed to edit file: ${filePath}`);
      }

      // Complete operation
      this.completeOperation(operationId, "edit", [filePath]);
      timer.end();

      this.logger.info(`✏️ File edited successfully: ${filePath}`);
      return {
        success: true,
        filePath,
        operationId,
        editsApplied: edits.length,
      };
    } catch (error) {
      timer.end();
      this.failOperation(operationId, error);

      // Attempt rollback if backup exists
      if (options.createBackup !== false) {
        try {
          await this.rollbackFile(filePath);
          this.logger.info(
            `🔄 Rolled back file after edit failure: ${filePath}`
          );
        } catch (rollbackError) {
          this.logger.error(
            `Failed to rollback file ${filePath}:`,
            rollbackError
          );
        }
      }

      this.logger.error(`Failed to edit file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * 🗑️ Delete file safely
   */
  async deleteFile(filePath, options = {}) {
    if (!this.isInitialized) {
      throw new Error("File Operations not initialized");
    }

    const timer = this.performanceMonitor.startTimer("file_delete");
    const operationId = this.generateOperationId();

    try {
      this.logger.info(`🗑️ Deleting file: ${filePath}`);

      const uri = vscode.Uri.file(filePath);

      // Create backup if requested
      if (options.createBackup !== false) {
        await this.createBackup(filePath);
      }

      // Create workspace edit
      const edit = new vscode.WorkspaceEdit();
      edit.deleteFile(uri, { recursive: options.recursive || false });

      // Track operation
      this.activeOperations.set(operationId, {
        type: "delete",
        files: [filePath],
        timestamp: Date.now(),
        edit,
        backupCreated: options.createBackup !== false,
      });

      // Apply edit
      const success = await vscode.workspace.applyEdit(edit);

      if (!success) {
        throw new Error(`Failed to delete file: ${filePath}`);
      }

      // Complete operation
      this.completeOperation(operationId, "delete", [filePath]);
      timer.end();

      this.logger.info(`🗑️ File deleted successfully: ${filePath}`);
      return { success: true, filePath, operationId };
    } catch (error) {
      timer.end();
      this.failOperation(operationId, error);
      this.logger.error(`Failed to delete file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * 📋 Copy file
   */
  async copyFile(sourcePath, targetPath, options = {}) {
    if (!this.isInitialized) {
      throw new Error("File Operations not initialized");
    }

    const timer = this.performanceMonitor.startTimer("file_copy");
    const operationId = this.generateOperationId();

    try {
      this.logger.info(`📋 Copying file: ${sourcePath} -> ${targetPath}`);

      const sourceUri = vscode.Uri.file(sourcePath);
      const targetUri = vscode.Uri.file(targetPath);

      // Read source content
      const sourceContent = await vscode.workspace.fs.readFile(sourceUri);

      // Create workspace edit
      const edit = new vscode.WorkspaceEdit();
      edit.createFile(targetUri, { overwrite: options.overwrite || false });
      edit.insert(
        targetUri,
        new vscode.Position(0, 0),
        Buffer.from(sourceContent).toString("utf8")
      );

      // Track operation
      this.activeOperations.set(operationId, {
        type: "copy",
        files: [sourcePath, targetPath],
        timestamp: Date.now(),
        edit,
      });

      // Apply edit
      const success = await vscode.workspace.applyEdit(edit);

      if (!success) {
        throw new Error(`Failed to copy file: ${sourcePath} -> ${targetPath}`);
      }

      // Complete operation
      this.completeOperation(operationId, "copy", [sourcePath, targetPath]);
      timer.end();

      this.logger.info(
        `📋 File copied successfully: ${sourcePath} -> ${targetPath}`
      );
      return { success: true, sourcePath, targetPath, operationId };
    } catch (error) {
      timer.end();
      this.failOperation(operationId, error);
      this.logger.error(
        `Failed to copy file ${sourcePath} -> ${targetPath}:`,
        error
      );
      throw error;
    }
  }

  /**
   * 🔄 Move/rename file
   */
  async moveFile(sourcePath, targetPath, options = {}) {
    if (!this.isInitialized) {
      throw new Error("File Operations not initialized");
    }

    const timer = this.performanceMonitor.startTimer("file_move");
    const operationId = this.generateOperationId();

    try {
      this.logger.info(`🔄 Moving file: ${sourcePath} -> ${targetPath}`);

      const sourceUri = vscode.Uri.file(sourcePath);
      const targetUri = vscode.Uri.file(targetPath);

      // Create backup if requested
      if (options.createBackup !== false) {
        await this.createBackup(sourcePath);
      }

      // Create workspace edit
      const edit = new vscode.WorkspaceEdit();
      edit.renameFile(sourceUri, targetUri, {
        overwrite: options.overwrite || false,
      });

      // Track operation
      this.activeOperations.set(operationId, {
        type: "move",
        files: [sourcePath, targetPath],
        timestamp: Date.now(),
        edit,
        backupCreated: options.createBackup !== false,
      });

      // Apply edit
      const success = await vscode.workspace.applyEdit(edit);

      if (!success) {
        throw new Error(`Failed to move file: ${sourcePath} -> ${targetPath}`);
      }

      // Complete operation
      this.completeOperation(operationId, "move", [sourcePath, targetPath]);
      timer.end();

      this.logger.info(
        `🔄 File moved successfully: ${sourcePath} -> ${targetPath}`
      );
      return { success: true, sourcePath, targetPath, operationId };
    } catch (error) {
      timer.end();
      this.failOperation(operationId, error);
      this.logger.error(
        `Failed to move file ${sourcePath} -> ${targetPath}:`,
        error
      );
      throw error;
    }
  }

  /**
   * 🔄 Batch operations - apply multiple file operations atomically
   */
  async batchOperations(operations, options = {}) {
    if (!this.isInitialized) {
      throw new Error("File Operations not initialized");
    }

    const timer = this.performanceMonitor.startTimer("batch_operations");
    const operationId = this.generateOperationId();

    try {
      this.logger.info(
        `🔄 Executing batch operations: ${operations.length} operations`
      );

      // Create backups for all files if requested
      const filesToBackup = new Set();
      if (options.createBackup !== false) {
        for (const op of operations) {
          if (
            op.type === "edit" ||
            op.type === "delete" ||
            op.type === "move"
          ) {
            filesToBackup.add(op.filePath || op.sourcePath);
          }
        }

        for (const filePath of filesToBackup) {
          await this.createBackup(filePath);
        }
      }

      // Create single workspace edit for all operations
      const edit = new vscode.WorkspaceEdit();
      const affectedFiles = [];

      for (const operation of operations) {
        affectedFiles.push(operation.filePath || operation.sourcePath);

        switch (operation.type) {
          case "create":
            const createUri = vscode.Uri.file(operation.filePath);
            edit.createFile(createUri, {
              overwrite: operation.overwrite || false,
            });
            if (operation.content) {
              edit.insert(
                createUri,
                new vscode.Position(0, 0),
                operation.content
              );
            }
            break;

          case "edit":
            const editUri = vscode.Uri.file(operation.filePath);
            for (const editItem of operation.edits || []) {
              if (editItem.range) {
                edit.replace(editUri, editItem.range, editItem.text || "");
              } else if (editItem.position) {
                edit.insert(editUri, editItem.position, editItem.text || "");
              }
            }
            break;

          case "delete":
            const deleteUri = vscode.Uri.file(operation.filePath);
            edit.deleteFile(deleteUri, {
              recursive: operation.recursive || false,
            });
            break;

          case "move":
            const moveSourceUri = vscode.Uri.file(operation.sourcePath);
            const moveTargetUri = vscode.Uri.file(operation.targetPath);
            edit.renameFile(moveSourceUri, moveTargetUri, {
              overwrite: operation.overwrite || false,
            });
            affectedFiles.push(operation.targetPath);
            break;

          case "copy":
            // Copy requires reading content first
            const copySourceUri = vscode.Uri.file(operation.sourcePath);
            const copyTargetUri = vscode.Uri.file(operation.targetPath);
            const copyContent = await vscode.workspace.fs.readFile(
              copySourceUri
            );
            edit.createFile(copyTargetUri, {
              overwrite: operation.overwrite || false,
            });
            edit.insert(
              copyTargetUri,
              new vscode.Position(0, 0),
              Buffer.from(copyContent).toString("utf8")
            );
            affectedFiles.push(operation.targetPath);
            break;
        }
      }

      // Track operation
      this.activeOperations.set(operationId, {
        type: "batch",
        files: affectedFiles,
        timestamp: Date.now(),
        edit,
        operationCount: operations.length,
        backupCreated: options.createBackup !== false,
      });

      // Apply all edits atomically
      const success = await vscode.workspace.applyEdit(edit);

      if (!success) {
        throw new Error("Failed to apply batch operations");
      }

      // Complete operation
      this.completeOperation(operationId, "batch", affectedFiles);
      timer.end();

      this.logger.info(
        `🔄 Batch operations completed successfully: ${operations.length} operations`
      );
      return {
        success: true,
        operationId,
        operationsCount: operations.length,
        affectedFiles: affectedFiles.length,
      };
    } catch (error) {
      timer.end();
      this.failOperation(operationId, error);

      // Attempt rollback if backups exist
      if (options.createBackup !== false) {
        try {
          await this.rollbackBatch(Array.from(filesToBackup));
          this.logger.info("🔄 Rolled back batch operations after failure");
        } catch (rollbackError) {
          this.logger.error(
            "Failed to rollback batch operations:",
            rollbackError
          );
        }
      }

      this.logger.error("Failed to execute batch operations:", error);
      throw error;
    }
  }

  /**
   * 💾 Create backup of file
   */
  async createBackup(filePath) {
    try {
      const uri = vscode.Uri.file(filePath);
      const content = await vscode.workspace.fs.readFile(uri);
      const contentString = Buffer.from(content).toString("utf8");

      // Check backup size limit
      if (contentString.length > this.maxBackupSize) {
        this.logger.warn(
          `File too large for backup: ${filePath} (${contentString.length} bytes)`
        );
        return false;
      }

      this.backupStorage.set(filePath, {
        content: contentString,
        timestamp: Date.now(),
        size: contentString.length,
      });

      this.logger.debug(`💾 Created backup for: ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to create backup for ${filePath}:`, error);
      return false;
    }
  }

  /**
   * 🔄 Rollback file from backup
   */
  async rollbackFile(filePath) {
    try {
      const backup = this.backupStorage.get(filePath);
      if (!backup) {
        throw new Error(`No backup found for file: ${filePath}`);
      }

      const uri = vscode.Uri.file(filePath);
      const edit = new vscode.WorkspaceEdit();

      // Replace entire file content with backup
      const document = await vscode.workspace.openTextDocument(uri);
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );

      edit.replace(uri, fullRange, backup.content);

      const success = await vscode.workspace.applyEdit(edit);
      if (!success) {
        throw new Error(`Failed to apply rollback for: ${filePath}`);
      }

      this.logger.info(`🔄 Rolled back file: ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to rollback file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * 🔄 Rollback multiple files from backup
   */
  async rollbackBatch(filePaths) {
    const results = [];

    for (const filePath of filePaths) {
      try {
        await this.rollbackFile(filePath);
        results.push({ filePath, success: true });
      } catch (error) {
        results.push({ filePath, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * 🆔 Generate unique operation ID
   */
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * ✅ Complete operation
   */
  completeOperation(operationId, type, files) {
    const operation = this.activeOperations.get(operationId);
    if (operation) {
      this.activeOperations.delete(operationId);

      // Add to history
      this.operationHistory.push({
        id: operationId,
        type,
        files,
        timestamp: operation.timestamp,
        duration: Date.now() - operation.timestamp,
        status: "completed",
      });

      // Limit history size
      if (this.operationHistory.length > this.maxHistorySize) {
        this.operationHistory.shift();
      }

      this.performanceMonitor.recordMetric(`file_operation_${type}_success`, 1);
    }
  }

  /**
   * ❌ Fail operation
   */
  failOperation(operationId, error) {
    const operation = this.activeOperations.get(operationId);
    if (operation) {
      this.activeOperations.delete(operationId);

      // Add to history
      this.operationHistory.push({
        id: operationId,
        type: operation.type,
        files: operation.files,
        timestamp: operation.timestamp,
        duration: Date.now() - operation.timestamp,
        status: "failed",
        error: error.message,
      });

      // Limit history size
      if (this.operationHistory.length > this.maxHistorySize) {
        this.operationHistory.shift();
      }

      this.performanceMonitor.recordMetric(
        `file_operation_${operation.type}_failure`,
        1
      );
    }
  }

  /**
   * 📊 Get operation statistics
   */
  getStats() {
    const completedOps = this.operationHistory.filter(
      (op) => op.status === "completed"
    );
    const failedOps = this.operationHistory.filter(
      (op) => op.status === "failed"
    );

    return {
      activeOperations: this.activeOperations.size,
      totalOperations: this.operationHistory.length,
      completedOperations: completedOps.length,
      failedOperations: failedOps.length,
      backupsStored: this.backupStorage.size,
      averageDuration:
        completedOps.length > 0
          ? completedOps.reduce((sum, op) => sum + op.duration, 0) /
            completedOps.length
          : 0,
    };
  }

  /**
   * 📋 Get operation history
   */
  getHistory(limit = 20) {
    return this.operationHistory.slice(-limit).reverse(); // Most recent first
  }

  /**
   * 🧹 Clear old backups
   */
  clearOldBackups(maxAge = 3600000) {
    // 1 hour default
    const now = Date.now();
    const toDelete = [];

    for (const [filePath, backup] of this.backupStorage.entries()) {
      if (now - backup.timestamp > maxAge) {
        toDelete.push(filePath);
      }
    }

    for (const filePath of toDelete) {
      this.backupStorage.delete(filePath);
    }

    if (toDelete.length > 0) {
      this.logger.debug(`🧹 Cleared ${toDelete.length} old backups`);
    }

    return toDelete.length;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      this.logger.info("Cleaning up File Operations...");
      this.activeOperations.clear();
      this.backupStorage.clear();
      this.operationHistory = [];
      this.isInitialized = false;
    } catch (error) {
      this.logger.error("Error during File Operations cleanup:", error);
    }
  }
}

module.exports = FileOps;
