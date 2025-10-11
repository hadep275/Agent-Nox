const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');

/**
 * Enterprise-grade logger with structured logging, multiple outputs, and performance tracking
 */
class Logger {
    constructor(context) {
        this.context = context;
        this.logLevel = this.getLogLevel();
        this.outputChannel = vscode.window.createOutputChannel('Agent');
        this.logFile = null;
        this.sessionId = this.generateSessionId();
        this.initializeLogFile();
    }

    /**
     * Get configured log level from settings
     */
    getLogLevel() {
        const config = vscode.workspace.getConfiguration('agent');
        const level = config.get('logLevel', 'info');
        
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        return levels[level] || 1;
    }

    /**
     * Generate unique session ID for tracking
     */
    generateSessionId() {
        return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Initialize log file for persistent logging
     */
    async initializeLogFile() {
        try {
            const logDir = path.join(this.context.globalStorageUri.fsPath, 'logs');
            await fs.mkdir(logDir, { recursive: true });
            
            const timestamp = new Date().toISOString().split('T')[0];
            this.logFile = path.join(logDir, `agent_${timestamp}.log`);
            
            // Write session start marker
            await this.writeToFile('INFO', 'Logger initialized', { sessionId: this.sessionId });
            
        } catch (error) {
            console.error('Failed to initialize log file:', error);
        }
    }

    /**
     * Format log message with timestamp and metadata
     */
    formatMessage(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            sessionId: this.sessionId,
            message,
            ...metadata
        };
        
        return JSON.stringify(logEntry);
    }

    /**
     * Write log entry to file
     */
    async writeToFile(level, message, metadata = {}) {
        if (!this.logFile) return;
        
        try {
            const formattedMessage = this.formatMessage(level, message, metadata);
            await fs.appendFile(this.logFile, formattedMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    /**
     * Write to VS Code output channel
     */
    writeToOutput(level, message, metadata = {}) {
        const timestamp = new Date().toLocaleTimeString();
        const metadataStr = Object.keys(metadata).length > 0 ? ` | ${JSON.stringify(metadata)}` : '';
        const outputMessage = `[${timestamp}] ${level}: ${message}${metadataStr}`;
        
        this.outputChannel.appendLine(outputMessage);
    }

    /**
     * Check if message should be logged based on level
     */
    shouldLog(level) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        return levels[level] >= this.logLevel;
    }

    /**
     * Debug level logging
     */
    debug(message, metadata = {}) {
        if (!this.shouldLog('debug')) return;
        
        this.writeToOutput('DEBUG', message, metadata);
        this.writeToFile('DEBUG', message, metadata);
    }

    /**
     * Info level logging
     */
    info(message, metadata = {}) {
        if (!this.shouldLog('info')) return;
        
        this.writeToOutput('INFO', message, metadata);
        this.writeToFile('INFO', message, metadata);
    }

    /**
     * Warning level logging
     */
    warn(message, metadata = {}) {
        if (!this.shouldLog('warn')) return;
        
        this.writeToOutput('WARN', message, metadata);
        this.writeToFile('WARN', message, metadata);
    }

    /**
     * Error level logging
     */
    error(message, error = null, metadata = {}) {
        if (!this.shouldLog('error')) return;
        
        const errorMetadata = {
            ...metadata,
            ...(error && {
                errorMessage: error.message,
                errorStack: error.stack,
                errorName: error.name
            })
        };
        
        this.writeToOutput('ERROR', message, errorMetadata);
        this.writeToFile('ERROR', message, errorMetadata);
    }

    /**
     * Performance timing helper
     */
    time(label) {
        const startTime = Date.now();
        return {
            end: () => {
                const duration = Date.now() - startTime;
                this.debug(`Timer ${label} completed`, { duration, label });
                return duration;
            }
        };
    }

    /**
     * Log API call with timing and metadata
     */
    logApiCall(provider, model, tokens, duration, cost = null) {
        this.info('AI API call completed', {
            provider,
            model,
            tokens,
            duration,
            cost,
            type: 'api_call'
        });
    }

    /**
     * Log user action for analytics
     */
    logUserAction(action, metadata = {}) {
        this.info('User action', {
            action,
            ...metadata,
            type: 'user_action'
        });
    }

    /**
     * Log performance metric
     */
    logPerformance(metric, value, metadata = {}) {
        this.debug('Performance metric', {
            metric,
            value,
            ...metadata,
            type: 'performance'
        });
    }

    /**
     * Show output channel to user
     */
    show() {
        this.outputChannel.show();
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            await this.writeToFile('INFO', 'Logger cleanup initiated');
            this.outputChannel.dispose();
        } catch (error) {
            console.error('Error during logger cleanup:', error);
        }
    }
}

module.exports = Logger;
