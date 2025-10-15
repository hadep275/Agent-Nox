export = AgentController;
/**
 * Main Agent Controller - orchestrates all agent operations with enterprise-grade architecture
 */
declare class AgentController {
    constructor(context: any, logger: any, performanceMonitor: any);
    context: any;
    logger: any;
    performanceMonitor: any;
    aiClient: import("./aiClient") | null;
    contextManager: import("./contextManager") | null;
    fileOps: import("./fileOps") | null;
    indexEngine: import("./indexEngine") | null;
    cacheManager: import("../storage/cacheManager") | null;
    isInitialized: boolean;
    workspacePath: string | null;
    configuration: vscode.WorkspaceConfiguration | null;
    /**
     * Initialize the agent controller and all core components
     */
    initialize(): Promise<void>;
    /**
     * Load and validate configuration
     */
    loadConfiguration(): Promise<void>;
    configValues: {
        aiProvider: string;
        enableCaching: boolean;
        enableTelemetry: boolean;
        maxContextSize: number;
        logLevel: string;
    } | {
        aiProvider: string;
        enableCaching: boolean;
        enableTelemetry: boolean;
        maxContextSize: number;
        logLevel: string;
    } | undefined;
    /**
     * Get configuration value with fallback
     */
    get(key: any, defaultValue?: null): any;
    /**
     * Initialize workspace context
     */
    initializeWorkspace(): Promise<void>;
    /**
     * Initialize core components with dependency injection
     */
    initializeCoreComponents(): Promise<void>;
    /**
     * Validate that all components are properly initialized
     */
    validateInitialization(): Promise<void>;
    /**
     * Handle workspace folder changes
     */
    handleWorkspaceChange(_event: any): Promise<void>;
    /**
     * Handle file changes for intelligent indexing
     */
    handleFileChange(document: any): Promise<void>;
    /**
     * Update configuration when settings change
     */
    updateConfiguration(): Promise<void>;
    /**
     * Get agent status and health information
     */
    getStatus(): {
        initialized: boolean;
        workspace: string | null;
        components: {
            aiClient: boolean;
            contextManager: boolean;
            fileOps: boolean;
            indexEngine: boolean;
            cacheManager: boolean;
        };
        performance: any;
        costs: any;
    };
    /**
     * Execute an agent task with full orchestration
     */
    executeTask(taskType: any, parameters?: {}): Promise<{
        taskType: any;
        parameters: {};
        status: string;
        timestamp: number;
        message: string;
    }>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
import vscode = require("vscode");
//# sourceMappingURL=agentController.d.ts.map