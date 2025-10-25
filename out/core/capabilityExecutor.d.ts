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
    codeGenerator: NoxCodeGenerator;
    gitOps: NoxGitOperations | null;
    autonomyManager: NoxAutonomyManager | null;
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
        autonomyLevel: string;
    }>;
    /**
     * 🔐 Request user approval for capability execution
     */
    requestUserApproval(capability: any, capabilityId: any): any;
    /**
     * 🎨 Generate basic template when intelligent generation fails
     */
    generateBasicTemplate(fileName: any, language: any, requirements: any): string;
    /**
     * 📄 Execute file creation capability with intelligent code generation
     */
    executeFileCreation(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        result: any;
        message: string;
        generated: boolean;
        metadata: {
            strategy: string;
            language: any;
        } | undefined;
        error?: undefined;
    } | {
        success: boolean;
        type: string;
        error: any;
        message: string;
        result?: undefined;
        generated?: undefined;
        metadata?: undefined;
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
     * 🎨 Execute code generation capability
     */
    executeCodeGeneration(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        result: {
            code: any;
            filePath: any;
            metadata: {
                strategy: string;
                framework: any;
                language: any;
                generationTime: any;
                patterns: string[];
                dependencies: any;
            };
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        type: string;
        result: {
            code: any;
            metadata: {
                strategy: string;
                framework: any;
                language: any;
                generationTime: any;
                patterns: string[];
                dependencies: any;
            };
            filePath?: undefined;
        };
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
     * 🏗️ Execute project scaffolding capability
     */
    executeProjectScaffolding(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        result: {
            projectPath: any;
            createdFiles: string[];
            metadata: {
                strategy: string;
                framework: any;
                language: any;
                generationTime: any;
                patterns: string[];
                dependencies: any;
            };
        };
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
     * 📁 Execute multi-file creation capability
     */
    executeMultiFileCreation(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        result: {
            createdFiles: string[];
            errors: {
                file: any;
                error: any;
            }[];
            successCount: number;
            errorCount: number;
        };
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
     * 📝 Execute Git commit capability
     */
    executeGitCommit(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        result: {
            hash: string;
            message: any;
            files: any;
        };
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
     * ⬆️ Execute Git push capability
     */
    executeGitPush(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        result: {
            branch: string;
            remote: any;
        };
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
     * 🌿 Execute Git branch creation capability
     */
    executeGitBranchCreate(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        result: {
            name: any;
            base: string;
        };
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
     * 🔄 Execute Git branch switch capability
     */
    executeGitBranchSwitch(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        result: {
            branch: any;
        };
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
     * 🔀 Execute Git merge capability
     */
    executeGitMerge(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        result: {
            source: any;
            target: string;
        };
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
     * 📊 Execute Git status capability
     */
    executeGitStatus(capability: any, context: any): Promise<{
        success: boolean;
        type: string;
        result: {
            isRepo: boolean;
            branch: null;
            changes: never[];
            ahead: number;
            behind: number;
            hasChanges?: undefined;
            hasStaged?: undefined;
            hasUnstaged?: undefined;
        } | {
            isRepo: boolean;
            branch: string;
            changes: any;
            ahead: number;
            behind: number;
            hasChanges: boolean;
            hasStaged: any;
            hasUnstaged: any;
        };
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
     * 🧹 Cleanup resources
     */
    cleanup(): void;
}
import NoxCodeGenerator = require("./codeGenerator");
import NoxGitOperations = require("./gitOps");
import NoxAutonomyManager = require("./autonomyManager");
//# sourceMappingURL=capabilityExecutor.d.ts.map