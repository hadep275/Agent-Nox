export = RefactorCommand;
/**
 * Refactor Command Handler - refactors selected code
 */
declare class RefactorCommand {
    constructor(agentController: any, logger: any);
    agentController: any;
    logger: any;
    /**
     * Execute the refactor command
     */
    execute(): Promise<void>;
}
//# sourceMappingURL=refactorCommand.d.ts.map