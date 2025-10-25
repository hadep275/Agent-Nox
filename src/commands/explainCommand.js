const vscode = require("vscode");

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
        await vscode.window.showWarningMessage("No active editor found");
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText.trim()) {
        await vscode.window.showWarningMessage(
          "Please select some code to explain"
        );
        return;
      }

      this.logger.info("Explain command executed", {
        fileName: editor.document.fileName,
        selectionLength: selectedText.length,
      });

      // Execute task through agent controller
      const result = await this.agentController.executeTask("explain", {
        code: selectedText,
        fileName: editor.document.fileName,
        language: editor.document.languageId,
        timestamp: Date.now(),
      });

      // Show result with enhanced capabilities
      if (result.content) {
        // Show the AI explanation in a more detailed way
        const panel = vscode.window.createWebviewPanel(
          "noxExplanation",
          "🦊 NOX Code Explanation",
          vscode.ViewColumn.Beside,
          { enableScripts: true }
        );

        panel.webview.html = this.generateExplanationHTML(result, selectedText);
      } else {
        await vscode.window.showInformationMessage(
          `Code Explanation: ${result.message || "Explanation completed"}`,
          "OK"
        );
      }

      // Show capability suggestions if any
      if (result.capabilities && result.capabilities.suggested.length > 0) {
        const suggestions = result.capabilities.suggested
          .map((cap) => cap.description)
          .join("\n• ");
        const choice = await vscode.window.showInformationMessage(
          `🦊 NOX suggests:\n• ${suggestions}`,
          "Execute Suggestions",
          "Dismiss"
        );

        if (choice === "Execute Suggestions") {
          for (const capability of result.capabilities.suggested) {
            await this.agentController.executeCapability(capability);
          }
        }
      }

      this.logger.info("Explain interaction completed");
    } catch (error) {
      this.logger.error("Explain command failed:", error);
      await vscode.window.showErrorMessage(`Explain failed: ${error.message}`);
    }
  }

  /**
   * Generate HTML for explanation display
   */
  generateExplanationHTML(result, selectedCode) {
    const { content, provider, model, tokens, cost } = result;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NOX Code Explanation</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
                margin: 0;
            }
            .header {
                border-bottom: 2px solid var(--vscode-panel-border);
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .title {
                font-size: 24px;
                font-weight: bold;
                color: var(--vscode-textLink-foreground);
                margin: 0;
            }
            .metadata {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin-top: 5px;
            }
            .code-section {
                background-color: var(--vscode-textCodeBlock-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                padding: 15px;
                margin: 15px 0;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                overflow-x: auto;
            }
            .explanation {
                background-color: var(--vscode-editor-background);
                border-left: 4px solid var(--vscode-textLink-foreground);
                padding: 15px;
                margin: 15px 0;
            }
            .stats {
                display: flex;
                gap: 20px;
                margin-top: 20px;
                padding: 10px;
                background-color: var(--vscode-badge-background);
                border-radius: 4px;
                font-size: 12px;
            }
            .stat {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .stat-value {
                font-weight: bold;
                font-size: 16px;
            }
            .stat-label {
                color: var(--vscode-descriptionForeground);
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="title">🦊 NOX Code Explanation</h1>
            <div class="metadata">
                Powered by ${provider} (${model}) • ${
      tokens?.total || 0
    } tokens • $${cost?.total?.toFixed(4) || "0.0000"}
            </div>
        </div>

        <h3>📄 Code Being Explained:</h3>
        <div class="code-section">${this.escapeHtml(selectedCode)}</div>

        <h3>💡 NOX Explanation:</h3>
        <div class="explanation">${this.formatMarkdown(content)}</div>

        <div class="stats">
            <div class="stat">
                <div class="stat-value">${provider}</div>
                <div class="stat-label">AI Provider</div>
            </div>
            <div class="stat">
                <div class="stat-value">${tokens?.total || 0}</div>
                <div class="stat-label">Tokens Used</div>
            </div>
            <div class="stat">
                <div class="stat-value">$${
                  cost?.total?.toFixed(4) || "0.0000"
                }</div>
                <div class="stat-label">Cost</div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Escape HTML characters
   */
  escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Basic markdown formatting
   */
  formatMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  }
}

module.exports = ExplainCommand;
