export = NoxChatViewProvider;
/**
 * 🦊 Nox Chat Sidebar - WebviewViewProvider for Sidebar Integration
 * Aurora-themed chat interface embedded in VS Code sidebar (like Augment chat)
 */
declare class NoxChatViewProvider {
    constructor(context: any, agentController: any, logger: any);
    context: any;
    agentController: any;
    logger: any;
    voiceRecordingService: VoiceRecordingService;
    webviewView: any;
    disposables: any[];
    chatHistory: any[];
    isAIResponding: boolean;
    /**
     * 🎨 WebviewViewProvider interface - called when view is first shown
     */
    resolveWebviewView(webviewView: any, context: any, token: any): void;
    /**
     * 🔧 Setup message handling between webview and extension
     */
    setupMessageHandling(): void;
    /**
     * 🤖 Handle user message and get AI response
     */
    handleUserMessage(userMessage: any): Promise<void>;
    /**
     * 📨 Send message to webview
     */
    sendMessageToWebview(message: any): void;
    /**
     * ❌ Send error message to webview
     */
    sendErrorToWebview(error: any): void;
    /**
     * 🗑️ Clear chat history
     */
    clearChatHistory(): Promise<void>;
    /**
     * 🗑️ Clear chat history
     */
    clearChatHistory(): void;
    /**
     * 🗑️ Delete a specific message
     */
    handleDeleteMessage(messageId: any): Promise<void>;
    /**
     * 🔄 Regenerate an assistant message
     */
    handleRegenerateMessage(messageId: any): Promise<void>;
    /**
     * 🔄 Handle provider change
     */
    handleProviderChange(provider: any): Promise<void>;
    /**
     * 🔄 Handle model change
     */
    handleModelChange(model: any): Promise<void>;
    /**
     * 📊 Send provider status to webview
     */
    sendProviderStatus(): Promise<void>;
    /**
     * 💾 Save chat history to workspace state
     */
    saveChatHistory(): Promise<void>;
    /**
     * 📖 Load chat history from workspace state
     */
    loadChatHistory(): Promise<void>;
    /**
     * 🚀 Handle webview ready event
     */
    handleWebviewReady(): Promise<void>;
    /**
     * 🔧 Setup view-specific events
     */
    setupViewEvents(): void;
    /**
     * 🧹 Cleanup resources
     */
    dispose(): void;
    /**
     * 🎨 Get webview HTML content (using bundled architecture)
     */
    getWebviewContent(): string;
    /**
     * 🎨 Generate a nonce for CSP
     */
    getNonce(): string;
    /**
     * 🎨 CSS is now bundled with webpack - this method is deprecated
     */
    getWebviewCSS(): string;
    /**
     * JavaScript functionality is now handled by bundled webview
     */
    getWebviewJS(): string;
    /**
     * 🔄 Update toggle button icon based on collapsed state
     */
    updateToggleButtonIcon(collapsed: any): Promise<void>;
    /**
     * 🎤 Start voice recording via extension backend
     */
    startVoiceRecording(): Promise<void>;
    /**
     * 🎤 Stop voice recording
     */
    stopVoiceRecording(): Promise<void>;
    /**
     * 🎤 Send current voice status to webview
     */
    sendVoiceStatus(): Promise<void>;
}
import VoiceRecordingService = require("../core/voiceRecordingService");
//# sourceMappingURL=chatSidebar.d.ts.map