/**
 * 🦊 Nox Webview Components
 * Enterprise-grade UI components for chat interface
 */
import { CodeBlockProps, MessageComponentProps } from './types';
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
    private static createMessageMeta;
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
//# sourceMappingURL=components.d.ts.map