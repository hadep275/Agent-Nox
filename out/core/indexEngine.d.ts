export = IndexEngine;
/**
 * 🦊 Enterprise Index Engine for high-performance codebase indexing
 * Provides fast recursive scanning, incremental indexing, and large codebase support
 */
declare class IndexEngine {
    constructor(context: any, logger: any, performanceMonitor: any, contextManager: any);
    context: any;
    logger: any;
    performanceMonitor: any;
    contextManager: any;
    isInitialized: boolean;
    workspacePath: any;
    indexingInProgress: boolean;
    indexingQueue: any[];
    lastIndexTime: number | null;
    indexStats: {
        totalFiles: number;
        indexedFiles: number;
        skippedFiles: number;
        errors: number;
        lastIndexDuration: number;
    };
    fileWatchers: any[];
    watcherDisposables: any[];
    batchSize: number;
    maxConcurrency: number;
    indexingDelay: number;
    indexingTimer: any;
    /**
     * Initialize index engine
     */
    initialize(workspacePath: any): Promise<void>;
    /**
     * 👀 Setup file watchers for incremental indexing
     */
    setupFileWatchers(): Promise<void>;
    /**
     * 📅 Schedule indexing operation
     */
    scheduleIndexing(reason?: string, delay?: null): void;
    /**
     * 🔍 Perform full workspace indexing
     */
    performFullIndexing(reason?: string): Promise<void>;
    /**
     * 📁 Scan workspace for files
     */
    scanWorkspaceFiles(): Promise<any[]>;
    /**
     * 📂 Recursively scan directory
     */
    scanDirectory(dirPath: any, files: any, depth?: number): Promise<void>;
    /**
     * 🔄 Process files in batches
     */
    processBatches(files: any): Promise<void>;
    /**
     * 📦 Process a single batch of files
     */
    processBatch(files: any): Promise<void>;
    /**
     * 📄 Process a single file
     */
    processFile(filePath: any): Promise<void>;
    /**
     * 📝 Queue file for incremental indexing
     */
    queueFileForIndexing(filePath: any, operation: any): Promise<void>;
    /**
     * ⏱️ Debounced queue processing
     */
    debounceQueueProcessing(): void;
    queueProcessingTimer: NodeJS.Timeout | null | undefined;
    /**
     * 🔄 Process indexing queue
     */
    processIndexingQueue(): Promise<void>;
    /**
     * 🗑️ Remove file from index
     */
    removeFileFromIndex(filePath: any): Promise<void>;
    /**
     * Reinitialize with new workspace
     */
    reinitialize(workspacePath: any): Promise<void>;
    /**
     * Update file index (called by agent controller)
     */
    updateFileIndex(filePath: any, content: any): Promise<void>;
    /**
     * 📊 Get indexing statistics
     */
    getStats(): {
        isIndexing: boolean;
        lastIndexTime: number | null;
        queueSize: number;
        workspacePath: any;
        contextStats: any;
        totalFiles: number;
        indexedFiles: number;
        skippedFiles: number;
        errors: number;
        lastIndexDuration: number;
    };
    /**
     * 🔍 Force reindexing
     */
    forceReindex(): Promise<boolean>;
    /**
     * ⏸️ Pause indexing
     */
    pauseIndexing(): void;
    indexingPaused: boolean | undefined;
    /**
     * ▶️ Resume indexing
     */
    resumeIndexing(): void;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=indexEngine.d.ts.map