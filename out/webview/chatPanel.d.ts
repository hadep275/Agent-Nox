export = ChatPanel;
/**
 * 🦊 Nox Chat Panel - Custom Webview Interface
 * Aurora-themed chat interface with fox mascot and enterprise features
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
     * 📁 Export chat history
     */
    exportChatHistory(): Promise<void>;
    /**
     * ⚙️ Open settings panel
     */
    openSettings(): Promise<void>;
    /**
     * 🔄 Switch AI provider
     */
    switchAIProvider(provider: any): Promise<void>;
    /**
     * 🧹 Dispose of the panel and clean up resources
     */
    dispose(): void;
    /**
     * 🎨 Get the webview HTML content
     */
    getWebviewContent(): string;
    /**
     * 📄 Generate the HTML content for the webview
     */
    getWebviewHTML(): string;
    /**
     * 🎨 Get Aurora-themed CSS styles
     */
    getWebviewCSS(): string;
    /**
     * 🚀 Get JavaScript functionality for the webview
     */
    getWebviewJS(): string;
    /**
     * 🔐 Generate a nonce for CSP
     */
    getNonce(): string;
}
declare namespace ChatPanel {
    let currentPanel: any;
}
//# sourceMappingURL=chatPanel.d.ts.map