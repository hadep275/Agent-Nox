/**
 * 🦊 Nox Webview Components
 * Enterprise-grade UI components for chat interface
 */
import { ChatMessage, CodeBlockProps, MessageComponentProps } from './types';
/**
 * Message Component Factory
 */
export declare class MessageComponent {
    /**
     * Create a message element with markdown rendering
     */
    static create(props: MessageComponentProps): HTMLElement;
    /**
     * Create message metadata element with enhanced info and actions
     */
    static createMessageMeta(message: ChatMessage): HTMLElement;
    /**
     * Copy message content to clipboard
     */
    private static copyMessageContent;
    /**
     * Regenerate assistant message
     */
    private static regenerateMessage;
    /**
     * Delete message
     */
    private static deleteMessage;
}
/**
 * Code Block Component (placeholder for Phase 4)
 */
export declare class CodeBlockComponent {
    static create(props: CodeBlockProps): HTMLElement;
    private static createCopyButton;
}
/**
 * Provider Selector Component
 */
export declare class ProviderSelectorComponent {
    static create(currentProvider: string, providers: Record<string, any>, onProviderChange: (provider: string) => void): HTMLElement;
}
/**
 * Model Selector Component
 */
export declare class ModelSelectorComponent {
    static create(currentModel: string, models: string[], onModelChange: (model: string) => void): HTMLElement;
    private static getModelDisplayName;
}
/**
 * Thinking Indicator Component
 */
export declare class ThinkingIndicatorComponent {
    static create(): HTMLElement;
}
/**
 * Streaming Message Component
 * Handles real-time streaming AI responses with progress indicators
 */
export declare class StreamingMessageComponent {
    private static activeBuffers;
    private static globalSpeed;
    private static userHasScrolled;
    private static lastScrollTime;
    private static markdownRenderTimers;
    private static lastMarkdownRender;
    private static autoScrollDisabled;
    /**
     * Create a streaming message element with progress indicators and stop button
     */
    static create(messageId: string): HTMLElement;
    /**
     * Update streaming message content with new chunk using smart buffering
     */
    static updateContent(messageId: string, chunk: string, tokens?: number): void;
    /**
     * Flush buffered content to display (called by StreamingBuffer)
     */
    private static flushContentToDisplay;
    /**
     * TEMPORARILY DISABLED FOR TESTING: Schedule smart markdown rendering
     */
    private static scheduleSmartMarkdownRender;
    /**
     * TEMPORARILY DISABLED FOR TESTING: Render markdown safely
     */
    private static renderMarkdownSafely;
    /**
     * Update progress indicators
     */
    private static updateProgress;
    /**
     * Complete streaming and convert to regular message
     */
    static completeStreaming(messageId: string, finalMessage: ChatMessage): void;
    /**
     * Stop streaming request
     */
    private static stopStreaming;
    /**
     * Handle streaming error
     */
    static handleStreamingError(messageId: string, error: string): void;
    /**
     * ⏹️ Handle stream stopped - Update UI to show stopped state with continue option
     */
    static handleStreamStopped(messageId: string, partialContent?: string): void;
    /**
     * ▶️ Continue streaming request
     */
    private static continueStreaming;
    /**
     * SIMPLE: Only expand container, NO scroll interference during streaming
     */
    private static expandContainerOnly;
    /**
     * OPTIONAL: Gentle scroll to bottom only when streaming completes
     */
    private static optionalScrollToBottomOnComplete;
    /**
     * Setup scroll listener to detect user scroll intent
     */
    private static setupScrollListener;
    /**
     * Ensure streaming content is visible and container expands properly
     * NEVER hold the page hostage - respect user scroll freedom
     */
    private static ensureContentVisible;
    /**
     * Show scroll indicator when user scrolls up during streaming
     */
    private static showScrollIndicator;
    /**
     * Hide scroll indicator
     */
    private static hideScrollIndicator;
    /**
     * Scroll to bottom and hide indicator
     */
    private static scrollToBottom;
    /**
     * Set global streaming speed for all new streams
     */
    static setStreamingSpeed(speed: 'slow' | 'medium' | 'fast' | 'instant'): void;
    /**
     * Get current streaming speed
     */
    static getStreamingSpeed(): string;
    /**
     * Get available streaming speeds with descriptions
     */
    static getAvailableSpeeds(): Array<{
        value: string;
        label: string;
        description: string;
    }>;
}
//# sourceMappingURL=components.d.ts.map