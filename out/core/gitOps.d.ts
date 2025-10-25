export = NoxGitOperations;
declare class NoxGitOperations {
    constructor(logger: any, performanceMonitor: any, contextManager: any);
    logger: any;
    performanceMonitor: any;
    contextManager: any;
    workspaceRoot: string | undefined;
    isInitialized: boolean;
    /**
     * 🚀 Initialize Git operations
     */
    init(): Promise<void>;
    isGitRepo: boolean | undefined;
    /**
     * 🔧 Execute Git command
     */
    execGit(command: any, options?: {}): Promise<string>;
    /**
     * 📊 Get current Git status
     */
    getStatus(): Promise<{
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
    }>;
    /**
     * 🌿 Get current branch name
     */
    getCurrentBranch(): Promise<string>;
    /**
     * 📈 Get ahead/behind count
     */
    getAheadBehind(): Promise<{
        ahead: number;
        behind: number;
    }>;
    /**
     * 📝 Parse Git status output
     */
    parseStatusOutput(statusOutput: any): any;
    /**
     * 🎨 Generate intelligent commit message
     */
    generateCommitMessage(files: any, context?: {}): Promise<{
        message: string;
        type: string;
        scope: string | null;
        description: string;
        analysis: {
            patterns: never[];
            complexity: string;
            domains: never[];
            operations: never[];
        };
    } | {
        message: string;
        type: string;
        scope: null;
        description: string;
        analysis: {
            patterns: never[];
            complexity: string;
        };
    }>;
    /**
     * 🔍 Analyze code changes
     */
    analyzeChanges(files: any, context: any): Promise<{
        patterns: never[];
        complexity: string;
        domains: never[];
        operations: never[];
    }>;
    /**
     * 📁 Analyze individual file
     */
    analyzeFile(file: any): {
        patterns: never[];
        domains: never[];
        operations: never[];
    };
    /**
     * 🏷️ Determine commit type
     */
    determineCommitType(analysis: any): "refactor" | "test" | "docs" | "feat!" | "chore" | "feat" | "fix";
    /**
     * 🎯 Determine commit scope
     */
    determineScope(analysis: any): "api" | "test" | "config" | "ui" | "auth" | "docs" | null;
    /**
     * 📝 Generate commit description
     */
    generateDescription(analysis: any): string;
    /**
     * 📝 Stage files for commit
     */
    stageFiles(files?: any[]): Promise<{
        success: boolean;
        stagedFiles: any[];
    }>;
    /**
     * 💾 Create commit
     */
    createCommit(message: any, options?: {}): Promise<{
        success: boolean;
        hash: string;
        message: any;
        timestamp: string;
    }>;
    /**
     * 🌿 Create new branch
     */
    createBranch(branchName: any, baseBranch?: null): Promise<{
        success: boolean;
        name: any;
        base: string;
        created: string;
    }>;
    /**
     * 🔄 Switch to branch
     */
    switchBranch(branchName: any): Promise<{
        success: boolean;
        branch: any;
        timestamp: string;
    }>;
    /**
     * ⬆️ Push changes to remote
     */
    pushChanges(branch?: null, options?: {}): Promise<{
        success: boolean;
        branch: string;
        remote: any;
        timestamp: string;
    }>;
    /**
     * 🔀 Merge branch
     */
    mergeBranch(sourceBranch: any, targetBranch?: null, options?: {}): Promise<{
        success: boolean;
        source: any;
        target: string;
        timestamp: string;
    }>;
    /**
     * ✅ Validate branch name
     */
    isValidBranchName(name: any): boolean;
    /**
     * 🏷️ Generate branch name from feature description
     */
    generateBranchName(feature: any, context?: {}): any;
    /**
     * 🧹 Cleanup resources
     */
    cleanup(): void;
}
//# sourceMappingURL=gitOps.d.ts.map