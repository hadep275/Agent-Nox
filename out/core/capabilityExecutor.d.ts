export = CapabilityExecutor;
/**
 * 🦊 NOX Capability Executor - Executes AI-suggested capabilities with user approval
 * Provides safe execution of file operations, terminal commands, and other AI suggestions
 */
declare class CapabilityExecutor {
    constructor(agentController: any, fileOps: any, logger: any, performanceMonitor: any);
    agentController: any;
    fileOps: any;
    logger: any;
    performanceMonitor: any;
    pendingApprovals: Map<any, any>;
    executionHistory: any[];
    maxHistorySize: number;
    isInitialized: boolean;
    /**
     * 🚀 Execute capability with appropriate approval flow
     */
    executeCapability(capability: any, context?: {}): Promise<{
        success: boolean;
        type: string;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        type: string;
        error: any;
        message: string;
    } | {
        success: boolean;
        type: any;
        message: string;
        suggestion: string;
    } | {
        success: boolean;
        reason: string;
        error: any;
        capabilityId: string;
        executionTime: any;
    } | {
        success: boolean;
        reason: string;
        capabilityId: string;
        message: string;
    }>;
    /**
     * 🔐 Request user approval for capability execution
     */
    requestUserApproval(capability: any, capabilityId: any): any;
    /**
     * 📄 Execute file creation capability
     */
    executeFileCreation(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        result: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        type: string;
        error: any;
        message: string;
        result?: undefined;
    }>;
    /**
     * ✏️ Execute file edit capability
     */
    executeFileEdit(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        result: any;
        backupPath: string;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        type: string;
        error: any;
        message: string;
        result?: undefined;
        backupPath?: undefined;
    }>;
    /**
     * 🗑️ Execute file deletion capability
     */
    executeFileDeletion(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        result: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        type: string;
        error: any;
        message: string;
        result?: undefined;
    }>;
    /**
     * ⚡ Execute terminal command capability
     */
    executeTerminalCommand(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        type: string;
        error: any;
        message: string;
    }>;
    /**
     * 📦 Execute package installation capability
     */
    executePackageInstallation(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        type: string;
        error: any;
        message: string;
    }>;
    /**
     * 🔧 Execute generic capability
     */
    executeGenericCapability(capability: any, context: any): Promise<{
        success: boolean;
        type: any;
        message: string;
        suggestion: string;
    }>;
    /**
     * 📋 Format capability details for user display
     */
    formatCapabilityDetails(capability: any): string;
    /**
     * 📊 Record capability execution
     */
    recordExecution(capabilityId: any, capability: any, result: any, context: any): void;
    /**
     * 🆔 Generate unique capability ID
     */
    generateCapabilityId(): string;
    /**
     * 📊 Get execution statistics
     */
    getStats(): {
        totalExecutions: number;
        successful: number;
        failed: number;
        successRate: number;
        pendingApprovals: number;
        recentExecutions: any[];
    };
    /**
     * 🧹 Cleanup resources
     */
    cleanup(): void;
}
//# sourceMappingURL=capabilityExecutor.d.ts.map