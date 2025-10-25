export = NoxAutonomyManager;
declare class NoxAutonomyManager {
    constructor(logger: any, performanceMonitor: any);
    logger: any;
    performanceMonitor: any;
    isInitialized: boolean;
    settings: {
        autonomyLevel: string;
        gitOperations: {
            autoCommit: boolean;
            autoPush: boolean;
            autoCreateBranches: boolean;
            autoGenerateCommitMessages: boolean;
            autoStageFiles: boolean;
        };
        fileOperations: {
            autoCreate: boolean;
            autoEdit: boolean;
            autoDelete: boolean;
        };
        terminalOperations: {
            autoInstallPackages: boolean;
            autoRunBuildCommands: boolean;
            autoRunTests: boolean;
        };
        webOperations: {
            autoSearch: boolean;
            autoFetchDocumentation: boolean;
        };
        approvalSettings: {
            showRiskLevel: boolean;
            showPreview: boolean;
            requireExplicitApproval: boolean;
            timeoutSeconds: number;
        };
    };
    /**
     * 🚀 Initialize autonomy manager
     */
    init(): Promise<void>;
    /**
     * 📖 Load settings from VS Code configuration
     */
    loadSettings(): Promise<void>;
    /**
     * 💾 Save settings to VS Code configuration
     */
    saveSettings(): Promise<void>;
    /**
     * 🎛️ Set autonomy level
     */
    setAutonomyLevel(level: any): Promise<{
        previous: string;
        current: any;
        settings: {
            autonomyLevel: string;
            gitOperations: {
                autoCommit: boolean;
                autoPush: boolean;
                autoCreateBranches: boolean;
                autoGenerateCommitMessages: boolean;
                autoStageFiles: boolean;
            };
            fileOperations: {
                autoCreate: boolean;
                autoEdit: boolean;
                autoDelete: boolean;
            };
            terminalOperations: {
                autoInstallPackages: boolean;
                autoRunBuildCommands: boolean;
                autoRunTests: boolean;
            };
            webOperations: {
                autoSearch: boolean;
                autoFetchDocumentation: boolean;
            };
            approvalSettings: {
                showRiskLevel: boolean;
                showPreview: boolean;
                requireExplicitApproval: boolean;
                timeoutSeconds: number;
            };
        };
    }>;
    /**
     * ⚙️ Update operation settings based on autonomy level
     */
    updateOperationSettings(level: any): void;
    /**
     * 🔍 Check if operation requires approval
     */
    requiresApproval(operationType: any, operationDetails?: {}): boolean;
    /**
     * 📊 Get current autonomy status
     */
    getStatus(): {
        level: string;
        isAutonomous: boolean;
        isCollaborative: boolean;
        settings: {
            autonomyLevel: string;
            gitOperations: {
                autoCommit: boolean;
                autoPush: boolean;
                autoCreateBranches: boolean;
                autoGenerateCommitMessages: boolean;
                autoStageFiles: boolean;
            };
            fileOperations: {
                autoCreate: boolean;
                autoEdit: boolean;
                autoDelete: boolean;
            };
            terminalOperations: {
                autoInstallPackages: boolean;
                autoRunBuildCommands: boolean;
                autoRunTests: boolean;
            };
            webOperations: {
                autoSearch: boolean;
                autoFetchDocumentation: boolean;
            };
            approvalSettings: {
                showRiskLevel: boolean;
                showPreview: boolean;
                requireExplicitApproval: boolean;
                timeoutSeconds: number;
            };
        };
        initialized: boolean;
    };
    /**
     * 🎯 Get operation-specific settings
     */
    getOperationSettings(operationType: any): {
        autoCommit: boolean;
        autoPush: boolean;
        autoCreateBranches: boolean;
        autoGenerateCommitMessages: boolean;
        autoStageFiles: boolean;
    } | {
        autoCreate: boolean;
        autoEdit: boolean;
        autoDelete: boolean;
    } | {
        autoInstallPackages: boolean;
        autoRunBuildCommands: boolean;
        autoRunTests: boolean;
    } | {
        autoSearch: boolean;
        autoFetchDocumentation: boolean;
    } | {
        showRiskLevel: boolean;
        showPreview: boolean;
        requireExplicitApproval: boolean;
        timeoutSeconds: number;
    };
    /**
     * 🏷️ Get operation category
     */
    getOperationCategory(operationType: any): "gitOperations" | "fileOperations" | "terminalOperations" | "webOperations" | "approvalSettings";
    /**
     * 🔄 Toggle autonomy level
     */
    toggleAutonomyLevel(): Promise<{
        previous: string;
        current: any;
        settings: {
            autonomyLevel: string;
            gitOperations: {
                autoCommit: boolean;
                autoPush: boolean;
                autoCreateBranches: boolean;
                autoGenerateCommitMessages: boolean;
                autoStageFiles: boolean;
            };
            fileOperations: {
                autoCreate: boolean;
                autoEdit: boolean;
                autoDelete: boolean;
            };
            terminalOperations: {
                autoInstallPackages: boolean;
                autoRunBuildCommands: boolean;
                autoRunTests: boolean;
            };
            webOperations: {
                autoSearch: boolean;
                autoFetchDocumentation: boolean;
            };
            approvalSettings: {
                showRiskLevel: boolean;
                showPreview: boolean;
                requireExplicitApproval: boolean;
                timeoutSeconds: number;
            };
        };
    }>;
    /**
     * 🧹 Cleanup resources
     */
    cleanup(): void;
}
//# sourceMappingURL=autonomyManager.d.ts.map