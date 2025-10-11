const vscode = require('vscode');

/**
 * Analyze Command Handler - analyzes codebase or selected files
 */
class AnalyzeCommand {
    constructor(agentController, logger) {
        this.agentController = agentController;
        this.logger = logger;
    }

    /**
     * Execute the analyze command
     */
    async execute() {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                await vscode.window.showWarningMessage('No workspace folder found');
                return;
            }

            this.logger.info('Analyze command executed', {
                workspacePath: workspaceFolders[0].uri.fsPath
            });

            // Execute task through agent controller
            const result = await this.agentController.executeTask('analyze', {
                workspacePath: workspaceFolders[0].uri.fsPath,
                timestamp: Date.now()
            });

            // Show result
            await vscode.window.showInformationMessage(
                `Codebase Analysis: ${result.message}`,
                'OK'
            );

            this.logger.info('Analyze interaction completed');

        } catch (error) {
            this.logger.error('Analyze command failed:', error);
            await vscode.window.showErrorMessage(`Analyze failed: ${error.message}`);
        }
    }
}

module.exports = AnalyzeCommand;
