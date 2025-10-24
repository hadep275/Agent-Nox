export = NoxSystemPrompt;
/**
 * 🦊 NOX System Prompt Builder - Gives AI providers NOX consciousness and identity
 * Transforms generic AI models into NOX-aware agents with full capabilities understanding
 */
declare class NoxSystemPrompt {
    constructor(logger: any, performanceMonitor: any);
    logger: any;
    performanceMonitor: any;
    noxVersion: string;
    buildTimestamp: number;
    /**
     * 🧠 Build comprehensive NOX system prompt for AI consciousness
     */
    buildSystemPrompt(taskType: any, context: any, provider: any): string;
    /**
     * 🛠️ Build capabilities section
     */
    buildCapabilitiesSection(context: any): string;
    /**
     * 📁 Build project structure section
     */
    buildProjectStructureSection(context: any): string;
    /**
     * 🔍 Build current context section
     */
    buildCurrentContextSection(context: any): string;
    /**
     * 💬 Build chat history section
     */
    buildChatHistorySection(context: any): string;
    /**
     * 🎯 Build task-specific prompt enhancement
     */
    buildTaskPrompt(taskType: any, parameters: any, context: any): string;
    /**
     * 💡 Build explain task prompt
     */
    buildExplainPrompt(parameters: any, context: any): string;
    /**
     * 🔧 Build refactor task prompt
     */
    buildRefactorPrompt(parameters: any, context: any): string;
    /**
     * 📊 Build analyze task prompt
     */
    buildAnalyzePrompt(parameters: any, context: any): string;
    /**
     * 🚀 Build generate task prompt
     */
    buildGeneratePrompt(parameters: any, context: any): string;
    /**
     * 💬 Build chat task prompt
     */
    buildChatPrompt(parameters: any, context: any): string;
    /**
     * 🔧 Build generic task prompt
     */
    buildGenericPrompt(taskType: any, parameters: any, context: any): string;
}
//# sourceMappingURL=noxSystemPrompt.d.ts.map