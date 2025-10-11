const vscode = require('vscode');

/**
 * Chat Command Handler - opens and manages the chat interface
 */
class ChatCommand {
    constructor(agentController, logger) {
        this.agentController = agentController;
        this.logger = logger;
    }

    /**
     * Execute the chat command
     */
    async execute() {
        try {
            this.logger.info('Chat command executed');
            
            // For Phase 1, show a simple input box
            const userInput = await vscode.window.showInputBox({
                prompt: 'Enter your message to Agent',
                placeHolder: 'Ask me anything about your code...',
                ignoreFocusOut: true
            });

            if (userInput) {
                // Execute task through agent controller
                const result = await this.agentController.executeTask('chat', {
                    message: userInput,
                    timestamp: Date.now()
                });

                // Show result
                await vscode.window.showInformationMessage(
                    `Agent: ${result.message}`,
                    'OK'
                );

                this.logger.info('Chat interaction completed', {
                    userInput: userInput.substring(0, 50),
                    responseLength: result.message.length
                });
            }

        } catch (error) {
            this.logger.error('Chat command failed:', error);
            await vscode.window.showErrorMessage(`Chat failed: ${error.message}`);
        }
    }
}

module.exports = ChatCommand;
