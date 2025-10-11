const vscode = require('vscode');

/**
 * Explain Command Handler - explains selected code
 */
class ExplainCommand {
    constructor(agentController, logger) {
        this.agentController = agentController;
        this.logger = logger;
    }

    /**
     * Execute the explain command
     */
    async execute() {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                await vscode.window.showWarningMessage('No active editor found');
                return;
            }

            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);

            if (!selectedText.trim()) {
                await vscode.window.showWarningMessage('Please select some code to explain');
                return;
            }

            this.logger.info('Explain command executed', {
                fileName: editor.document.fileName,
                selectionLength: selectedText.length
            });

            // Execute task through agent controller
            const result = await this.agentController.executeTask('explain', {
                code: selectedText,
                fileName: editor.document.fileName,
                language: editor.document.languageId,
                timestamp: Date.now()
            });

            // Show result
            await vscode.window.showInformationMessage(
                `Code Explanation: ${result.message}`,
                'OK'
            );

            this.logger.info('Explain interaction completed');

        } catch (error) {
            this.logger.error('Explain command failed:', error);
            await vscode.window.showErrorMessage(`Explain failed: ${error.message}`);
        }
    }
}

module.exports = ExplainCommand;
