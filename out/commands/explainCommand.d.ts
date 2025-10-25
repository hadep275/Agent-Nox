export = ExplainCommand;
/**
 * Explain Command Handler - explains selected code
 */
declare class ExplainCommand {
    constructor(agentController: any, logger: any);
    agentController: any;
    logger: any;
    /**
     * Execute the explain command
     */
    execute(): Promise<void>;
    /**
     * Generate HTML for explanation display
     */
    generateExplanationHTML(result: any, selectedCode: any): string;
    /**
     * Escape HTML characters
     */
    escapeHtml(text: any): any;
    /**
     * Basic markdown formatting
     */
    formatMarkdown(text: any): any;
}
//# sourceMappingURL=explainCommand.d.ts.map