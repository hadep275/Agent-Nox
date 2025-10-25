const vscode = require("vscode");

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
        await vscode.window.showWarningMessage("No workspace folder found");
        return;
      }

      this.logger.info("Analyze command executed", {
        workspacePath: workspaceFolders[0].uri.fsPath,
      });

      // Execute task through agent controller
      const result = await this.agentController.executeTask("analyze", {
        workspacePath: workspaceFolders[0].uri.fsPath,
        timestamp: Date.now(),
      });

      // Show comprehensive analysis result
      if (result.content) {
        // Create analysis report panel
        const panel = vscode.window.createWebviewPanel(
          "noxAnalysis",
          "🦊 NOX Codebase Analysis",
          vscode.ViewColumn.Beside,
          { enableScripts: true }
        );

        panel.webview.html = this.generateAnalysisHTML(result);
      } else {
        await vscode.window.showInformationMessage(
          `Codebase Analysis: ${result.message || "Analysis completed"}`,
          "OK"
        );
      }

      // Show analysis capabilities and statistics
      if (result.capabilities && result.capabilities.executed.length > 0) {
        const analysisData = result.capabilities.executed.find(
          (cap) => cap.type === "codebase_analysis"
        );
        if (analysisData) {
          const stats = analysisData.data;
          await vscode.window.showInformationMessage(
            `📊 Analysis Complete:\n• ${stats.totalFiles} files indexed\n• ${stats.totalSymbols} symbols found\n• ${stats.projectStructure} directories`,
            "View Details"
          );
        }
      }

      // Handle suggestions
      if (result.capabilities && result.capabilities.suggested.length > 0) {
        const suggestions = result.capabilities.suggested
          .map((cap) => cap.description)
          .join("\n• ");
        const choice = await vscode.window.showInformationMessage(
          `🦊 NOX recommends:\n• ${suggestions}`,
          "Execute Recommendations",
          "Dismiss"
        );

        if (choice === "Execute Recommendations") {
          for (const capability of result.capabilities.suggested) {
            await this.agentController.executeCapability(capability);
          }
        }
      }

      this.logger.info("Analyze interaction completed");
    } catch (error) {
      this.logger.error("Analyze command failed:", error);
      await vscode.window.showErrorMessage(`Analyze failed: ${error.message}`);
    }
  }

  /**
   * Generate HTML for analysis report display
   */
  generateAnalysisHTML(result) {
    const { content, provider, model, tokens, cost, capabilities } = result;
    const analysisData =
      capabilities?.executed?.find((cap) => cap.type === "codebase_analysis")
        ?.data || {};

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NOX Codebase Analysis</title>
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
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            .stat-card {
                background-color: var(--vscode-badge-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }
            .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: var(--vscode-textLink-foreground);
                margin-bottom: 5px;
            }
            .stat-label {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .analysis-content {
                background-color: var(--vscode-editor-background);
                border-left: 4px solid var(--vscode-textLink-foreground);
                padding: 20px;
                margin: 20px 0;
                border-radius: 0 8px 8px 0;
            }
            .section {
                margin: 20px 0;
            }
            .section h3 {
                color: var(--vscode-textLink-foreground);
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 5px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="title">🦊 NOX Codebase Analysis Report</h1>
            <div class="metadata">
                Powered by ${provider} (${model}) • ${
      tokens?.total || 0
    } tokens • $${cost?.total?.toFixed(4) || "0.0000"}
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${analysisData.totalFiles || 0}</div>
                <div class="stat-label">Files Indexed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${analysisData.totalSymbols || 0}</div>
                <div class="stat-label">Symbols Found</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${
                  analysisData.projectStructure || 0
                }</div>
                <div class="stat-label">Directories</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${
                  analysisData.indexingTime || 0
                }ms</div>
                <div class="stat-label">Indexing Time</div>
            </div>
        </div>

        <div class="section">
            <h3>📊 Analysis Results</h3>
            <div class="analysis-content">${this.formatMarkdown(content)}</div>
        </div>

        ${
          capabilities?.suggested?.length > 0
            ? `
        <div class="section">
            <h3>💡 Recommendations</h3>
            <ul>
                ${capabilities.suggested
                  .map((cap) => `<li>${cap.description}</li>`)
                  .join("")}
            </ul>
        </div>
        `
            : ""
        }
    </body>
    </html>
    `;
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

module.exports = AnalyzeCommand;
