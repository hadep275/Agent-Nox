export = Logger;
/**
 * Enterprise-grade logger with structured logging, multiple outputs, and performance tracking
 */
declare class Logger {
    constructor(context: any);
    context: any;
    logLevel: number;
    outputChannel: vscode.OutputChannel;
    logFile: string | null;
    sessionId: string;
    /**
     * Get configured log level from settings
     */
    getLogLevel(): number;
    /**
     * Generate unique session ID for tracking
     */
    generateSessionId(): string;
    /**
     * Initialize log file for persistent logging
     */
    initializeLogFile(): Promise<void>;
    /**
     * Format log message with timestamp and metadata
     */
    formatMessage(level: any, message: any, metadata?: {}): string;
    /**
     * Write log entry to file
     */
    writeToFile(level: any, message: any, metadata?: {}): Promise<void>;
    /**
     * Write to VS Code output channel
     */
    writeToOutput(level: any, message: any, metadata?: {}): void;
    /**
     * Check if message should be logged based on level
     */
    shouldLog(level: any): boolean;
    /**
     * Debug level logging
     */
    debug(message: any, metadata?: {}): void;
    /**
     * Info level logging
     */
    info(message: any, metadata?: {}): void;
    /**
     * Warning level logging
     */
    warn(message: any, metadata?: {}): void;
    /**
     * Error level logging
     */
    error(message: any, error?: null, metadata?: {}): void;
    /**
     * Performance timing helper
     */
    time(label: any): {
        end: () => number;
    };
    /**
     * Log API call with timing and metadata
     */
    logApiCall(provider: any, model: any, tokens: any, duration: any, cost?: null): void;
    /**
     * Log user action for analytics
     */
    logUserAction(action: any, metadata?: {}): void;
    /**
     * Log performance metric
     */
    logPerformance(metric: any, value: any, metadata?: {}): void;
    /**
     * Show output channel to user
     */
    show(): void;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
import vscode = require("vscode");
//# sourceMappingURL=logger.d.ts.map