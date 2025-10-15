export = AuditLogger;
/**
 * Enterprise Audit Logger for compliance and change tracking
 */
declare class AuditLogger {
    constructor(context: any, logger: any);
    context: any;
    logger: any;
    auditFile: string | null;
    sessionId: any;
    /**
     * Initialize audit log file
     */
    initializeAuditLog(): Promise<void>;
    /**
     * Log an audit event
     */
    logEvent(eventType: any, data?: {}): Promise<void>;
    /**
     * Log user action
     */
    logUserAction(action: any, details?: {}): Promise<void>;
    /**
     * Log file change
     */
    logFileChange(filePath: any, changeType: any, details?: {}): Promise<void>;
    /**
     * Log AI interaction
     */
    logAIInteraction(provider: any, model: any, prompt: any, response: any, metadata?: {}): Promise<void>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=auditLogger.d.ts.map