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
}
//# sourceMappingURL=explainCommand.d.ts.map