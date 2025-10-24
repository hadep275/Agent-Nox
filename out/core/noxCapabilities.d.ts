export = NoxCapabilities;
/**
 * 🦊 NOX Capabilities Registry - Defines what NOX can do and approval requirements
 * Provides comprehensive capability awareness for AI consciousness
 */
declare class NoxCapabilities {
    constructor(logger: any, performanceMonitor: any);
    logger: any;
    performanceMonitor: any;
    capabilities: {
        fileOperations: {
            enabled: boolean;
            capabilities: {
                create: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                edit: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                delete: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                move: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                copy: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                batchOperations: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        terminalOperations: {
            enabled: boolean;
            capabilities: {
                execute: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                packageManagement: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    allowedCommands: string[];
                    description: string;
                };
                buildCommands: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    allowedCommands: string[];
                    description: string;
                };
                testCommands: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    allowedCommands: string[];
                    description: string;
                };
            };
            restrictedCommands: string[];
        };
        gitOperations: {
            enabled: boolean;
            capabilities: {
                status: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                add: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                commit: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                branch: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                push: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                pull: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                merge: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                rebase: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        codeAnalysis: {
            enabled: boolean;
            capabilities: {
                fullCodebaseAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                dependencyAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                securityScanning: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                performanceAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                codeQualityAssessment: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                architectureAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        codeGeneration: {
            enabled: boolean;
            capabilities: {
                singleFile: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                multiFile: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                projectScaffolding: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                testGeneration: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                documentationGeneration: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                configurationGeneration: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        webResearch: {
            enabled: boolean;
            capabilities: {
                documentationLookup: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                packageRecommendations: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                stackOverflowIntegration: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                technologyTrends: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                securityAdvisories: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        workspaceOperations: {
            enabled: boolean;
            capabilities: {
                fileNavigation: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                symbolSearch: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                contextGathering: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                projectStructureAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
    };
    /**
     * 🛠️ Initialize comprehensive NOX capabilities
     */
    initializeCapabilities(): {
        fileOperations: {
            enabled: boolean;
            capabilities: {
                create: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                edit: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                delete: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                move: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                copy: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                batchOperations: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        terminalOperations: {
            enabled: boolean;
            capabilities: {
                execute: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                packageManagement: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    allowedCommands: string[];
                    description: string;
                };
                buildCommands: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    allowedCommands: string[];
                    description: string;
                };
                testCommands: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    allowedCommands: string[];
                    description: string;
                };
            };
            restrictedCommands: string[];
        };
        gitOperations: {
            enabled: boolean;
            capabilities: {
                status: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                add: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                commit: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                branch: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                push: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                pull: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                merge: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                rebase: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        codeAnalysis: {
            enabled: boolean;
            capabilities: {
                fullCodebaseAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                dependencyAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                securityScanning: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                performanceAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                codeQualityAssessment: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                architectureAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        codeGeneration: {
            enabled: boolean;
            capabilities: {
                singleFile: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                multiFile: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                projectScaffolding: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                testGeneration: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                documentationGeneration: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                configurationGeneration: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        webResearch: {
            enabled: boolean;
            capabilities: {
                documentationLookup: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                packageRecommendations: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                stackOverflowIntegration: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                technologyTrends: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                securityAdvisories: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        workspaceOperations: {
            enabled: boolean;
            capabilities: {
                fileNavigation: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                symbolSearch: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                contextGathering: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                projectStructureAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
    };
    /**
     * 🔍 Get capabilities for specific category
     */
    getCapabilities(category?: null): {
        fileOperations: {
            enabled: boolean;
            capabilities: {
                create: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                edit: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                delete: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                move: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                copy: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                batchOperations: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        terminalOperations: {
            enabled: boolean;
            capabilities: {
                execute: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                packageManagement: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    allowedCommands: string[];
                    description: string;
                };
                buildCommands: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    allowedCommands: string[];
                    description: string;
                };
                testCommands: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    allowedCommands: string[];
                    description: string;
                };
            };
            restrictedCommands: string[];
        };
        gitOperations: {
            enabled: boolean;
            capabilities: {
                status: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                add: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                commit: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                branch: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                push: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                pull: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                merge: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                rebase: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        codeAnalysis: {
            enabled: boolean;
            capabilities: {
                fullCodebaseAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                dependencyAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                securityScanning: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                performanceAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                codeQualityAssessment: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                architectureAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        codeGeneration: {
            enabled: boolean;
            capabilities: {
                singleFile: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                multiFile: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                projectScaffolding: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                testGeneration: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                documentationGeneration: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                configurationGeneration: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        webResearch: {
            enabled: boolean;
            capabilities: {
                documentationLookup: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                packageRecommendations: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                stackOverflowIntegration: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                technologyTrends: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                securityAdvisories: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
        workspaceOperations: {
            enabled: boolean;
            capabilities: {
                fileNavigation: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                symbolSearch: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                contextGathering: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
                projectStructureAnalysis: {
                    enabled: boolean;
                    requiresApproval: boolean;
                    description: string;
                };
            };
        };
    };
    /**
     * ✅ Check if capability is enabled
     */
    isCapabilityEnabled(category: any, capability: any): any;
    /**
     * 🔒 Check if capability requires approval
     */
    requiresApproval(category: any, capability: any): any;
    /**
     * 🚫 Check if command is restricted
     */
    isCommandRestricted(command: any): boolean;
    /**
     * ✅ Check if command is allowed for category
     */
    isCommandAllowed(category: any, capability: any, command: any): any;
    /**
     * 📋 Get capability summary for AI prompt
     */
    getCapabilitySummary(): string;
    /**
     * 🔧 Get capabilities for specific task type
     */
    getTaskCapabilities(taskType: any): {};
    /**
     * 📊 Get capability statistics
     */
    getCapabilityStats(): {
        total: number;
        enabled: number;
        disabled: number;
        requiresApproval: number;
        categories: number;
    };
    /**
     * 🔄 Update capability status
     */
    updateCapability(category: any, capability: any, updates: any): void;
    /**
     * 🔒 Disable capability
     */
    disableCapability(category: any, capability: any): void;
    /**
     * ✅ Enable capability
     */
    enableCapability(category: any, capability: any): void;
}
//# sourceMappingURL=noxCapabilities.d.ts.map