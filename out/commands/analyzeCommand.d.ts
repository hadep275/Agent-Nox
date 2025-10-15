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
}
//# sourceMappingURL=analyzeCommand.d.ts.map