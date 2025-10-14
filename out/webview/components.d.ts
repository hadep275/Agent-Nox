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
     * Create message metadata element
     */
    private static createMessageMeta;
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