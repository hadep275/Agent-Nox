export = ApiKeyCommand;
/**
 * 🔑 Nox API Key Management Command
 * Handles secure API key configuration for all providers
 */
declare class ApiKeyCommand {
    constructor(context: any, logger: any, aiClient: any);
    context: any;
    logger: any;
    aiClient: any;
    /**
     * 🔑 Main API key management command
     */
    execute(): Promise<void>;
    /**
     * 🔑 Set API key for a provider
     */
    setApiKey(): Promise<void>;
    /**
     * 🔑 Show API key input panel with better UX
     */
    showApiKeyInputPanel(provider: any): Promise<void>;
    /**
     * 🎨 Get HTML for API key input panel
     */
    getApiKeyInputHtml(provider: any): string;
    /**
     * 📖 Get provider-specific help text
     */
    getProviderHelp(providerId: any): any;
    /**
     * 👀 View configured providers
     */
    viewConfiguredProviders(): Promise<void>;
    /**
     * 🔄 Switch active provider
     */
    switchProvider(): Promise<void>;
    /**
     * 🗑️ Remove API key
     */
    removeApiKey(): Promise<void>;
}
//# sourceMappingURL=apiKeyCommand.d.ts.map