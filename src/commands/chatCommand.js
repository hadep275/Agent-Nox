const vscode = require("vscode");

/**
 * Chat Command Handler - opens and manages the chat interface
 */
class ChatCommand {
  constructor(agentController, logger) {
    this.agentController = agentController;
    this.logger = logger;
  }

  /**
   * 💬 Execute chat command - REAL AI INTEGRATION
   */
  async execute() {
    try {
      console.log("🦊 Chat command starting...");
      this.logger.info("🦊 Starting Nox chat...");

      // Get user input
      console.log("🦊 Showing input box...");
      const userMessage = await vscode.window.showInputBox({
        prompt: "🦊 What would you like to ask Nox?",
        placeHolder: "Ask me anything about your code...",
        ignoreFocusOut: true,
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return "Please enter a message";
          }
          return null;
        },
      });

      console.log("🦊 User input received:", userMessage ? "Yes" : "Cancelled");

      if (!userMessage) {
        console.log("🦊 User cancelled input");
        return; // User cancelled
      }

      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "🦊 Nox is thinking...",
          cancellable: false,
        },
        async (progress) => {
          try {
            console.log("🦊 Starting AI request...");
            console.log(
              "🦊 Agent controller:",
              this.agentController ? "Available" : "Missing"
            );
            console.log(
              "🦊 AI client:",
              this.agentController?.aiClient ? "Available" : "Missing"
            );

            // Get AI response using the real AI client
            const response = await this.agentController.aiClient.sendRequest(
              userMessage.trim()
            );

            console.log("🦊 AI response received:", response ? "Yes" : "No");

            // Show response in a new document
            await this.showChatResponse(userMessage, response);

            this.logger.info("🦊 Chat completed successfully");
            console.log("🦊 Chat completed successfully");
          } catch (error) {
            console.error("🦊 Chat failed:", error);
            this.logger.error("Chat failed:", error);

            if (error.message.includes("No API key")) {
              console.log("🦊 No API key error - showing setup dialog");
              const setupKeys = await vscode.window.showErrorMessage(
                "🔑 No API key configured. Would you like to set up your API keys now?",
                "Set Up API Keys",
                "Cancel"
              );

              if (setupKeys === "Set Up API Keys") {
                await vscode.commands.executeCommand("nox.apiKeys");
              }
            } else {
              console.log("🦊 Other error:", error.message);
              vscode.window.showErrorMessage(
                `🦊 Chat failed: ${error.message}`
              );
            }
          }
        }
      );
    } catch (error) {
      this.logger.error("Chat command failed:", error);
      vscode.window.showErrorMessage(`🦊 Chat failed: ${error.message}`);
    }
  }

  /**
   * 📄 Show chat response in a new document
   */
  async showChatResponse(userMessage, response) {
    try {
      const chatContent = `# 🦊 Nox Chat Response

## Your Question:
${userMessage}

## Nox's Response:
${response.content}

---
**Provider:** ${response.provider} (${response.model})
**Tokens:** ${response.tokens}
**Cost:** $${response.cost.toFixed(4)}
**Time:** ${new Date().toLocaleString()}
`;

      // Create new document
      const doc = await vscode.workspace.openTextDocument({
        content: chatContent,
        language: "markdown",
      });

      // Show the document
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      this.logger.error("Failed to show chat response:", error);
      // Fallback to simple message
      vscode.window.showInformationMessage(`🦊 ${response.content}`);
    }
  }
}

module.exports = ChatCommand;
