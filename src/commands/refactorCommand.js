const vscode = require("vscode");

/**
 * Refactor Command Handler - refactors selected code
 */
class RefactorCommand {
  constructor(agentController, logger) {
    this.agentController = agentController;
    this.logger = logger;
  }

  /**
   * Execute the refactor command
   */
  async execute() {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        await vscode.window.showWarningMessage("No active editor found");
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText.trim()) {
        await vscode.window.showWarningMessage(
          "Please select some code to refactor"
        );
        return;
      }

      this.logger.info("Refactor command executed", {
        fileName: editor.document.fileName,
        selectionLength: selectedText.length,
      });

      // Execute task through agent controller
      const result = await this.agentController.executeTask("refactor", {
        code: selectedText,
        fileName: editor.document.fileName,
        language: editor.document.languageId,
        timestamp: Date.now(),
      });

      // Show result with enhanced capabilities
      if (result.content) {
        await vscode.window.showInformationMessage(
          `🦊 NOX has analyzed your code and provided refactoring suggestions.`,
          "View Suggestions"
        );
      } else {
        await vscode.window.showInformationMessage(
          `Refactor Suggestion: ${result.message || "Refactoring completed"}`,
          "OK"
        );
      }

      // Handle capability suggestions and approvals
      if (result.capabilities) {
        // Show approval-required capabilities
        if (result.capabilities.requiresApproval.length > 0) {
          for (const capability of result.capabilities.requiresApproval) {
            const executionResult =
              await this.agentController.executeCapability(capability);
            if (executionResult.success) {
              await vscode.window.showInformationMessage(
                `✅ ${executionResult.message}`,
                "OK"
              );
            } else {
              await vscode.window.showWarningMessage(
                `⚠️ ${executionResult.message}`,
                "OK"
              );
            }
          }
        }

        // Show other suggestions
        if (result.capabilities.suggested.length > 0) {
          const suggestions = result.capabilities.suggested
            .map((cap) => cap.description)
            .join("\n• ");
          const choice = await vscode.window.showInformationMessage(
            `🦊 NOX also suggests:\n• ${suggestions}`,
            "Execute Suggestions",
            "Dismiss"
          );

          if (choice === "Execute Suggestions") {
            for (const capability of result.capabilities.suggested) {
              await this.agentController.executeCapability(capability);
            }
          }
        }
      }

      this.logger.info("Refactor interaction completed");
    } catch (error) {
      this.logger.error("Refactor command failed:", error);
      await vscode.window.showErrorMessage(`Refactor failed: ${error.message}`);
    }
  }
}

module.exports = RefactorCommand;
