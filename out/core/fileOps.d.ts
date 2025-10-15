export = FileOps;
/**
 * 🦊 Enterprise File Operations with atomic operations and rollback
 * Provides safe multi-file editing capabilities with enterprise-grade error handling
 */
declare class FileOps {
    constructor(context: any, logger: any, performanceMonitor: any);
    context: any;
    logger: any;
    performanceMonitor: any;
    isInitialized: boolean;
    activeOperations: Map<any, any>;
    backupStorage: Map<any, any>;
    operationHistory: any[];
    maxBackupSize: number;
    maxHistorySize: number;
    /**
     * Initialize file operations
     */
    initialize(): Promise<void>;
    workspaceEdit: typeof vscode.workspace | undefined;
    /**
     * 💾 Initialize backup storage
     */
    initializeBackupStorage(): Promise<void>;
    /**
     * 📝 Create a new file with content
     */
    createFile(filePath: any, content: any, options?: {}): Promise<{
        success: boolean;
        filePath: any;
        operationId: string;
    }>;
    /**
     * ✏️ Edit file content with atomic operations
     */
    editFile(filePath: any, edits: any, options?: {}): Promise<{
        success: boolean;
        filePath: any;
        operationId: string;
        editsApplied: any;
    }>;
    /**
     * 🗑️ Delete file safely
     */
    deleteFile(filePath: any, options?: {}): Promise<{
        success: boolean;
        filePath: any;
        operationId: string;
    }>;
    /**
     * 📋 Copy file
     */
    copyFile(sourcePath: any, targetPath: any, options?: {}): Promise<{
        success: boolean;
        sourcePath: any;
        targetPath: any;
        operationId: string;
    }>;
    /**
     * 🔄 Move/rename file
     */
    moveFile(sourcePath: any, targetPath: any, options?: {}): Promise<{
        success: boolean;
        sourcePath: any;
        targetPath: any;
        operationId: string;
    }>;
    /**
     * 🔄 Batch operations - apply multiple file operations atomically
     */
    batchOperations(operations: any, options?: {}): Promise<{
        success: boolean;
        operationId: string;
        operationsCount: any;
        affectedFiles: number;
    }>;
    /**
     * 💾 Create backup of file
     */
    createBackup(filePath: any): Promise<boolean>;
    /**
     * 🔄 Rollback file from backup
     */
    rollbackFile(filePath: any): Promise<boolean>;
    /**
     * 🔄 Rollback multiple files from backup
     */
    rollbackBatch(filePaths: any): Promise<({
        filePath: any;
        success: boolean;
        error?: undefined;
    } | {
        filePath: any;
        success: boolean;
        error: any;
    })[]>;
    /**
     * 🆔 Generate unique operation ID
     */
    generateOperationId(): string;
    /**
     * ✅ Complete operation
     */
    completeOperation(operationId: any, type: any, files: any): void;
    /**
     * ❌ Fail operation
     */
    failOperation(operationId: any, error: any): void;
    /**
     * 📊 Get operation statistics
     */
    getStats(): {
        activeOperations: number;
        totalOperations: number;
        completedOperations: number;
        failedOperations: number;
        backupsStored: number;
        averageDuration: number;
    };
    /**
     * 📋 Get operation history
     */
    getHistory(limit?: number): any[];
    /**
     * 🧹 Clear old backups
     */
    clearOldBackups(maxAge?: number): number;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
import vscode = require("vscode");
//# sourceMappingURL=fileOps.d.ts.map