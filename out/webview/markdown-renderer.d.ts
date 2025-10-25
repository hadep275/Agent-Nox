/**
 * 🦊 Nox Enterprise Markdown Renderer
 * Aurora-themed markdown rendering with syntax highlighting
 */
/**
 * Enterprise Markdown Renderer with Aurora theming
 */
export declare class NoxMarkdownRenderer {
    private static instance;
    private renderer;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): NoxMarkdownRenderer;
    /**
     * Setup custom Aurora-themed renderers
     */
    private setupCustomRenderers;
    /**
     * Configure marked with our custom renderer
     */
    private configureMarked;
    /**
     * Render markdown to HTML with Aurora theming
     */
    render(markdown: string): string;
    /**
     * Get display name for programming language
     */
    private getLanguageDisplayName;
    /**
     * Escape HTML for fallback rendering
     */
    private escapeHtml;
}
/**
 * Initialize copy button functionality with proper event listeners
 * This avoids CSP violations from inline onclick handlers
 */
export declare function initializeCopyButtons(): void;
//# sourceMappingURL=markdown-renderer.d.ts.map