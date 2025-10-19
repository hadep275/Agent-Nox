export = AIClient;
/**
 * 🦊 Nox AI Client - Multi-provider support with user-controlled API keys
 * Enterprise-grade AI client with secure API key management
 */
declare class AIClient {
    constructor(context: any, logger: any, performanceMonitor: any);
    context: any;
    logger: any;
    performanceMonitor: any;
    isInitialized: boolean;
    currentProvider: string;
    currentModel: any;
    providers: {
        anthropic: {
            name: string;
            models: string[];
            baseUrl: string;
            defaultModel: string;
        };
        openai: {
            name: string;
            models: string[];
            baseUrl: string;
            defaultModel: string;
        };
        deepseek: {
            name: string;
            models: string[];
            baseUrl: string;
            defaultModel: string;
        };
        local: {
            name: string;
            models: string[];
            baseUrl: string;
            defaultModel: string;
        };
    };
    /**
     * 🔐 Get API key securely from VS Code SecretStorage
     */
    getApiKey(provider: any): Promise<any>;
    /**
     * 🔐 Store API key securely in VS Code SecretStorage
     */
    setApiKey(provider: any, apiKey: any): Promise<boolean>;
    /**
     * 🔐 Remove API key from secure storage
     */
    removeApiKey(provider: any): Promise<boolean>;
    /**
     * 🔍 Check if provider has valid API key
     */
    hasValidApiKey(provider: any): Promise<any>;
    /**
     * Initialize AI client with configuration
     */
    initialize(configuration: any): Promise<void>;
    /**
     * 🔄 Switch AI provider
     */
    setProvider(provider: any): Promise<boolean>;
    /**
     * 📋 Get current provider info
     */
    getCurrentProvider(): any;
    /**
     * 📋 Get all available providers
     */
    getAvailableProviders(): any[];
    /**
     * 📋 Get providers with valid API keys
     */
    getConfiguredProviders(): Promise<any[]>;
    /**
     * Update configuration
     */
    updateConfiguration(configuration: any): Promise<void>;
    /**
     * 🌊 Send streaming request to AI provider - REAL-TIME IMPLEMENTATION
     */
    sendStreamingRequest(prompt: any, options?: {}, onChunk?: null, onComplete?: null, abortController?: null): Promise<{
        id: any;
        type: string;
        content: string;
        timestamp: string;
        tokens: number;
        cost: number;
        provider: string;
        model: any;
    } | null>;
    /**
     * 🤖 Send request to AI provider - REAL IMPLEMENTATION
     */
    sendRequest(prompt: any, options?: {}): Promise<{
        content: any;
        provider: string;
        model: any;
        tokens: any;
        cost: number;
    }>;
    /**
     * 🤖 Call Anthropic Claude API
     */
    callAnthropicAPI(apiKey: any, prompt: any, options?: {}): Promise<{
        content: any;
        provider: string;
        model: any;
        tokens: any;
        cost: number;
    }>;
    /**
     * 🧠 Call OpenAI GPT API
     */
    callOpenAIAPI(apiKey: any, prompt: any, options?: {}): Promise<{
        content: any;
        provider: string;
        model: any;
        tokens: any;
        cost: number;
    }>;
    /**
     * ⚡ Call DeepSeek API
     */
    callDeepSeekAPI(apiKey: any, prompt: any, options?: {}): Promise<{
        content: any;
        provider: string;
        model: any;
        tokens: any;
        cost: number;
    }>;
    /**
     * 🏠 Call Local LLM API (Ollama/LM Studio)
     */
    callLocalAPI(prompt: any, options?: {}): Promise<{
        content: any;
        provider: string;
        model: any;
        tokens: number;
        cost: number;
    }>;
    /**
     * 💰 Calculate Anthropic API costs
     */
    calculateAnthropicCost(usage: any, model: any): number;
    /**
     * 💰 Calculate OpenAI API costs
     */
    calculateOpenAICost(usage: any, model: any): number;
    /**
     * 💰 Calculate DeepSeek API costs
     */
    calculateDeepSeekCost(usage: any, model: any): number;
    /**
     * 🔄 Set current provider
     */
    setCurrentProvider(provider: any): Promise<void>;
    /**
     * 🔄 Set current model
     */
    setCurrentModel(model: any): Promise<void>;
    /**
     * 📋 Get current provider ID (string)
     */
    getCurrentProviderId(): string;
    /**
     * 📋 Get current model
     */
    getCurrentModel(): any;
    /**
     * 📋 Get all providers
     */
    getProviders(): {
        anthropic: {
            name: string;
            models: string[];
            baseUrl: string;
            defaultModel: string;
        };
        openai: {
            name: string;
            models: string[];
            baseUrl: string;
            defaultModel: string;
        };
        deepseek: {
            name: string;
            models: string[];
            baseUrl: string;
            defaultModel: string;
        };
        local: {
            name: string;
            models: string[];
            baseUrl: string;
            defaultModel: string;
        };
    };
    /**
     * 📋 Get models for current provider
     */
    getCurrentProviderModels(): any;
    /**
     * 📋 Get models for specific provider
     */
    getProviderModels(provider: any): any;
    /**
     * 🚨 Enhanced error message formatting
     */
    formatErrorMessage(error: any, provider: any): {
        title: string;
        message: any;
        suggestion: string;
        category: string;
        helpUrl: any;
    };
    /**
     * 🔍 Categorize and enhance error messages
     */
    categorizeError(error: any, provider: any): {
        title: string;
        message: any;
        suggestion: string;
        category: string;
        helpUrl: any;
    };
    /**
     * 🔗 Get help URLs for different providers and error types
     */
    getProviderHelpUrl(provider: any, errorType: any): any;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
    /**
     * 📊 Estimate token count for streaming progress
     */
    estimateTokens(text: any): number;
    /**
     * 🌊 Anthropic Claude Streaming API
     */
    callAnthropicStreamingAPI(apiKey: any, prompt: any, options: any, messageId: any, onChunk: any, onComplete: any, abortController?: null): Promise<{
        id: any;
        type: string;
        content: string;
        timestamp: string;
        tokens: number;
        cost: number;
        provider: string;
        model: any;
    } | null>;
    /**
     * 🌊 OpenAI GPT Streaming API
     */
    callOpenAIStreamingAPI(apiKey: any, prompt: any, options: any, messageId: any, onChunk: any, onComplete: any, abortController?: null): Promise<{
        id: any;
        type: string;
        content: string;
        timestamp: string;
        tokens: number;
        cost: number;
        provider: string;
        model: any;
    } | null>;
    /**
     * 🌊 DeepSeek Streaming API
     */
    callDeepSeekStreamingAPI(apiKey: any, prompt: any, options: any, messageId: any, onChunk: any, onComplete: any, abortController?: null): Promise<{
        id: any;
        type: string;
        content: string;
        timestamp: string;
        tokens: number;
        cost: number;
        provider: string;
        model: any;
    } | null>;
    /**
     * 🌊 Local LLM Streaming API (Ollama/LM Studio)
     */
    callLocalStreamingAPI(prompt: any, options: any, messageId: any, onChunk: any, onComplete: any): Promise<{
        id: any;
        type: string;
        content: string;
        timestamp: string;
        tokens: number;
        cost: number;
        provider: string;
        model: any;
    }>;
}
//# sourceMappingURL=aiClient.d.ts.map