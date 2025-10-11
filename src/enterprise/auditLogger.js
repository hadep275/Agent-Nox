const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Enterprise Audit Logger for compliance and change tracking
 */
class AuditLogger {
  constructor(context, logger) {
    this.context = context;
    this.logger = logger;
    this.auditFile = null;
    this.sessionId = uuidv4();
    this.initializeAuditLog();
  }

  /**
   * Initialize audit log file
   */
  async initializeAuditLog() {
    try {
      const auditDir = path.join(this.context.globalStorageUri.fsPath, 'audit');
      await fs.mkdir(auditDir, { recursive: true });

      const timestamp = new Date().toISOString().split('T')[0];
      this.auditFile = path.join(auditDir, `audit_${timestamp}.log`);

      // Write session start
      await this.logEvent('SESSION_START', {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        version: vscode.version,
        workspace:
          (vscode.workspace.workspaceFolders &&
            vscode.workspace.workspaceFolders[0] &&
            vscode.workspace.workspaceFolders[0].uri.fsPath) ||
          'none',
      });

      this.logger.debug('Audit logger initialized', {
        auditFile: this.auditFile,
      });
    } catch (error) {
      this.logger.error('Failed to initialize audit log:', error);
    }
  }

  /**
   * Log an audit event
   */
  async logEvent(eventType, data = {}) {
    if (!this.auditFile) return;

    try {
      const auditEntry = {
        id: uuidv4(),
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        eventType,
        data,
        user: process.env.USERNAME || process.env.USER || 'unknown',
      };

      const logLine = JSON.stringify(auditEntry) + '\n';
      await fs.appendFile(this.auditFile, logLine);
    } catch (error) {
      this.logger.error('Failed to write audit log:', error);
    }
  }

  /**
   * Log user action
   */
  async logUserAction(action, details = {}) {
    await this.logEvent('USER_ACTION', {
      action,
      ...details,
    });
  }

  /**
   * Log file change
   */
  async logFileChange(filePath, changeType, details = {}) {
    await this.logEvent('FILE_CHANGE', {
      filePath,
      changeType,
      ...details,
    });
  }

  /**
   * Log AI interaction
   */
  async logAIInteraction(provider, model, prompt, response, metadata = {}) {
    await this.logEvent('AI_INTERACTION', {
      provider,
      model,
      promptLength: prompt.length,
      responseLength: response.length,
      ...metadata,
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      await this.logEvent('SESSION_END', {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error during audit logger cleanup:', error);
    }
  }
}

module.exports = AuditLogger;
