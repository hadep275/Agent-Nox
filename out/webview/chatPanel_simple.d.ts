export = ChatPanel;
/**
 * 🦊 Nox Chat Panel - Simple Working Version
 * Aurora-themed chat interface with fox mascot
 */
declare class ChatPanel {
    /**
     * 🎨 Create or show the chat panel
     */
    static createOrShow(context: any, agentController: any, logger: any): any;
    constructor(context: any, agentController: any, logger: any);
    context: any;
    agentController: any;
    logger: any;
    panel: any;
    disposables: any[];
    chatHistory: any[];
    isAIResponding: boolean;
    /**
     * 🔧 Initialize the webview panel
     */
    initialize(): void;
    /**
     * 📨 Set up message handling between webview and extension
     */
    setupMessageHandling(): void;
    /**
     * 🎛️ Set up panel lifecycle events
     */
    setupPanelEvents(): void;
    /**
     * 💬 Handle user message and get AI response
     */
    handleUserMessage(userMessage: any): Promise<void>;
    /**
     * 📤 Send message to webview
     */
    sendMessageToWebview(message: any): void;
    /**
     * ❌ Send error message to webview
     */
    sendErrorToWebview(errorMessage: any): void;
    /**
     * 🔄 Send initial data when webview is ready
     */
    sendInitialData(): Promise<void>;
    /**
     * 💾 Load chat history from storage
     */
    loadChatHistory(): void;
    /**
     * 💾 Save chat history to storage
     */
    saveChatHistory(): void;
    /**
     * 🗑️ Clear chat history
     */
    clearChatHistory(): Promise<void>;
    /**
     * 🔑 Handle setting API key
     */
    handleSetApiKey(provider: any, apiKey: any): Promise<void>;
    /**
     * 🗑️ Handle removing API key
     */
    handleRemoveApiKey(provider: any): Promise<void>;
    /**
     * 📊 Send API key status to webview
     */
    sendApiKeyStatus(): Promise<void>;
    /**
     * 🔄 Handle switching AI provider
     */
    handleSwitchProvider(provider: any): Promise<void>;
    /**
     * ⚡ Handle executing Nox commands
     */
    handleExecuteCommand(command: any): Promise<void>;
    /**
     * 🧹 Dispose of the panel and clean up resources
     */
    dispose(): void;
    /**
     * 🎨 Get the webview HTML content
     */
    getWebviewContent(): string;
    /**
     * 🎨 Get Aurora-themed CSS styles
     */
    getWebviewCSS(): string;
    /**
     * 🚀 Get JavaScript functionality for the webview
     */
    getWebviewJS(): string;
    /**
     * 🔐 Generate a nonce for Content Security Policy
     */
    getNonce(): string;
}
declare namespace ChatPanel {
    let currentPanel: any;
}
//# sourceMappingURL=chatPanel_simple.d.ts.map