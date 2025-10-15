export = ChatCommand;
/**
 * Chat Command Handler - opens and manages the chat interface
 */
declare class ChatCommand {
    constructor(agentController: any, logger: any);
    agentController: any;
    logger: any;
    /**
     * 💬 Execute chat command - REAL AI INTEGRATION
     */
    execute(): Promise<void>;
    /**
     * 📄 Show chat response in a new document
     */
    showChatResponse(userMessage: any, response: any): Promise<void>;
}
//# sourceMappingURL=chatCommand.d.ts.map