export = TerminalManager;
declare class TerminalManager {
    constructor(logger: any, performanceMonitor: any, autonomyManager: any);
    logger: any;
    performanceMonitor: any;
    autonomyManager: any;
    isInitialized: boolean;
    terminals: Map<any, any>;
    commandHistory: any[];
    maxHistorySize: number;
    dangerousPatterns: RegExp[];
    restrictedCommands: string[];
    /**
     * 🚀 Initialize terminal manager
     */
    init(): Promise<void>;
    /**
     * 🔍 Validate command for safety
     */
    validateCommand(command: any): boolean;
    /**
     * 🎯 Check if command requires approval
     */
    requiresApproval(command: any): boolean;
    /**
     * ✅ Request user approval for command
     */
    requestApproval(command: any): Promise<boolean>;
    /**
     * 🎮 Get or create terminal
     */
    getOrCreateTerminal(name?: string): any;
    /**
     * 🚀 Execute command with output capture
     */
    executeCommand(command: any, options?: {}): Promise<{
        success: boolean;
        command: any;
        executed: boolean;
        message: string;
        terminalName?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        command: any;
        executed: boolean;
        terminalName: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        command: any;
        executed: boolean;
        error: any;
        message: string;
        terminalName?: undefined;
    }>;
    /**
     * 📦 Execute package installation
     */
    installPackage(packageName: any, options?: {}): Promise<{
        success: boolean;
        command: any;
        executed: boolean;
        message: string;
        terminalName?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        command: any;
        executed: boolean;
        terminalName: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        command: any;
        executed: boolean;
        error: any;
        message: string;
        terminalName?: undefined;
    }>;
    /**
     * 🧪 Execute test command
     */
    runTests(options?: {}): Promise<{
        success: boolean;
        command: any;
        executed: boolean;
        message: string;
        terminalName?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        command: any;
        executed: boolean;
        terminalName: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        command: any;
        executed: boolean;
        error: any;
        message: string;
        terminalName?: undefined;
    }>;
    /**
     * 🏗️ Execute build command
     */
    runBuild(options?: {}): Promise<{
        success: boolean;
        command: any;
        executed: boolean;
        message: string;
        terminalName?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        command: any;
        executed: boolean;
        terminalName: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        command: any;
        executed: boolean;
        error: any;
        message: string;
        terminalName?: undefined;
    }>;
    /**
     * 📜 Get command history
     */
    getHistory(limit?: number): any[];
    /**
     * 📝 Add command to history
     */
    addToHistory(command: any, status: any, error?: null): void;
    /**
     * 🧹 Close terminal
     */
    closeTerminal(name: any): void;
    /**
     * 🧹 Close all terminals
     */
    closeAllTerminals(): void;
    /**
     * 🧹 Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=terminalManager.d.ts.map