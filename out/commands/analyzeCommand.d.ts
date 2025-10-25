export = AnalyzeCommand;
/**
 * Analyze Command Handler - analyzes codebase or selected files
 */
declare class AnalyzeCommand {
    constructor(agentController: any, logger: any);
    agentController: any;
    logger: any;
    /**
     * Execute the analyze command
     */
    execute(): Promise<void>;
    /**
     * Generate HTML for analysis report display
     */
    generateAnalysisHTML(result: any): string;
    /**
     * Basic markdown formatting
     */
    formatMarkdown(text: any): any;
}
//# sourceMappingURL=analyzeCommand.d.ts.map