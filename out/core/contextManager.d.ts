export = ContextManager;
/**
 * 🦊 Enterprise Context Manager for intelligent code context retrieval
 * Provides intelligent code snippet retrieval and workspace analysis
 */
declare class ContextManager {
    constructor(context: any, logger: any, performanceMonitor: any, cacheManager: any);
    context: any;
    logger: any;
    performanceMonitor: any;
    cacheManager: any;
    isInitialized: boolean;
    fileIndex: Map<any, any>;
    symbolIndex: Map<any, any>;
    workspacePath: string | null;
    maxFileSize: number;
    supportedExtensions: Set<string>;
    excludePatterns: string[];
    /**
     * Initialize context manager
     */
    initialize(): Promise<void>;
    /**
     * 🔍 Start initial workspace indexing (async)
     */
    startInitialIndexing(): Promise<void>;
    /**
     * 📁 Scan workspace for files
     */
    scanWorkspace(): Promise<void>;
    /**
     * 📂 Recursively scan directory
     */
    scanDirectory(dirPath: any, depth?: number): Promise<void>;
    /**
     * 📄 Index a single file
     */
    indexFile(filePath: any): Promise<void>;
    /**
     * 🔍 Extract symbols from file content
     */
    extractSymbols(content: any, filePath: any): {
        name: any;
        type: string;
        line: any;
    }[];
    /**
     * 🔍 Extract JavaScript/TypeScript symbols
     */
    extractJavaScriptSymbols(line: any, lineNumber: any): {
        name: any;
        type: string;
        line: any;
    }[];
    /**
     * 🔍 Extract Python symbols
     */
    extractPythonSymbols(line: any, lineNumber: any): {
        name: any;
        type: string;
        line: any;
    }[];
    /**
     * 🔍 Extract Java/C# symbols
     */
    extractJavaSymbols(line: any, lineNumber: any): {
        name: any;
        type: string;
        line: any;
    }[];
    /**
     * 🔍 Extract generic symbols (comments, TODOs, etc.)
     */
    extractGenericSymbols(line: any, lineNumber: any): {
        name: string;
        type: string;
        line: any;
    }[];
    /**
     * 🔄 Update symbol index
     */
    updateSymbolIndex(filePath: any, symbols: any): void;
    /**
     * ❓ Should exclude file/directory
     */
    shouldExclude(name: any, fullPath: any): boolean;
    /**
     * ❓ Should index file
     */
    shouldIndexFile(filePath: any): boolean;
    /**
     * 🔍 Get relevant context for a query
     */
    getContext(query: any, options?: {}): Promise<{
        files: {
            path: string;
            content: {
                number: number;
                content: any;
                isMatch: boolean;
            }[];
            relevanceScore: number;
            symbols: any;
        }[];
        symbols: {
            name: any;
            file: string;
            line: any;
            type: any;
        }[];
        relevanceScore: number;
        query: any;
        totalFiles: number;
        searchTime: any;
    }>;
    /**
     * 🔍 Search files by content and name
     */
    searchFiles(query: any, maxFiles: any): {
        path: any;
        score: number;
    }[];
    /**
     * 🔍 Search symbols
     */
    searchSymbols(query: any): {
        name: any;
        file: string;
        line: any;
        type: any;
    }[];
    /**
     * 📄 Get relevant lines from file content
     */
    getRelevantLines(content: any, query: any, maxLines: any): {
        number: number;
        content: any;
        isMatch: boolean;
    }[];
    /**
     * 📊 Calculate overall relevance score
     */
    calculateOverallRelevance(files: any, symbols: any): number;
    /**
     * 🔄 Update file index when file changes
     */
    updateFileIndex(filePath: any, content: any): Promise<void>;
    /**
     * 📊 Get context statistics
     */
    getStats(): {
        totalFiles: number;
        totalSymbols: number;
        supportedExtensions: string[];
        workspacePath: string | null;
    };
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=contextManager.d.ts.map