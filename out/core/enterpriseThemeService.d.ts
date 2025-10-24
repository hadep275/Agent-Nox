export = EnterpriseThemeService;
declare class EnterpriseThemeService {
    constructor(context: any);
    context: any;
    logger: Logger;
    auditLogger: AuditLogger;
    performanceMonitor: PerformanceMonitor;
    currentTheme: any;
    themeCache: Map<any, any>;
    isInitialized: boolean;
    encryptionEnabled: boolean;
    auditEnabled: boolean;
    performanceTrackingEnabled: boolean;
    /**
     * 🚀 Initialize theme service
     */
    initialize(): Promise<boolean>;
    /**
     * 📚 Load theme definitions from local files
     */
    loadThemeDefinitions(): Promise<void>;
    /**
     * 🔄 Load current theme from encrypted storage
     */
    loadCurrentTheme(): Promise<void>;
    /**
     * 🔒 Get encrypted storage data
     */
    getEncryptedStorage(scope: any): Promise<any>;
    /**
     * 💾 Save theme settings with encryption
     */
    saveThemeSettings(themeData: any, scope?: string): Promise<boolean>;
    /**
     * 🔐 Simple encryption for theme data (enterprise-grade can be enhanced)
     */
    encryptThemeData(data: any): any;
    /**
     * 🔓 Simple decryption for theme data
     */
    decryptThemeData(encryptedData: any): any;
    /**
     * ✅ Validate theme schema
     */
    validateThemeSchema(theme: any): Promise<boolean>;
    /**
     * 🔍 Validate theme integrity
     */
    validateThemeIntegrity(): Promise<boolean>;
    /**
     * 🔄 Switch to fallback theme
     */
    switchToFallbackTheme(): Promise<void>;
    /**
     * 🆘 Load hardcoded fallback theme
     */
    loadFallbackTheme(): Promise<void>;
    /**
     * 📊 Setup performance monitoring
     */
    setupPerformanceMonitoring(): Promise<void>;
    /**
     * 🎨 Apply theme (main public method)
     */
    applyTheme(themeId: any, options?: {}): Promise<{
        success: boolean;
        theme: any;
        applyTime: number;
        previousTheme: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        theme?: undefined;
        applyTime?: undefined;
        previousTheme?: undefined;
    }>;
    /**
     * 📢 Notify webviews of theme change
     */
    notifyWebviewsThemeChange(theme: any): Promise<void>;
    /**
     * 🎨 Generate CSS variables for theme (Complete Aurora Integration)
     */
    generateCSSVariables(theme: any): {
        "--aurora-blue": any;
        "--aurora-purple": any;
        "--aurora-green": any;
        "--aurora-pink": any;
        "--aurora-cyan": any;
        "--aurora-orange": any;
        "--aurora-primary": any;
        "--aurora-secondary": any;
        "--aurora-accent": any;
        "--aurora-tertiary": any;
        "--aurora-quaternary": any;
        "--aurora-warning": any;
        "--aurora-error": any;
        "--aurora-success": any;
        "--aurora-info": any;
        "--bg-primary": any;
        "--bg-secondary": any;
        "--bg-tertiary": any;
        "--bg-surface": any;
        "--bg-elevated": any;
        "--text-primary": any;
        "--text-secondary": any;
        "--text-muted": any;
        "--text-inverse": any;
        "--gradient-aurora": any;
        "--gradient-secondary": any;
        "--gradient-accent": any;
        "--aurora-anim-1": string;
        "--aurora-anim-2": string;
        "--aurora-anim-3": string;
        "--aurora-anim-4": string;
        "--aurora-anim-5": string;
        "--theme-category": any;
        "--theme-id": any;
    };
    /**
     * 🎨 Convert hex color to RGB values
     */
    hexToRgb(hex: any): string;
    /**
     * 🎨 Apply CSS variables to webviews for Aurora animations
     */
    applyCSSVariables(theme: any): Promise<void>;
    /**
     * 📋 Get available themes
     */
    getAvailableThemes(): {
        id: any;
        name: any;
        category: any;
        description: any;
        preview: {
            primary: any;
            secondary: any;
            accent: any;
        };
    }[];
    /**
     * 🎯 Get current theme info
     */
    getCurrentTheme(): {
        id: any;
        name: any;
        category: any;
        colors: any;
        backgrounds: any;
        text: any;
        gradients: any;
    } | null;
    /**
     * 🔄 Reset to default theme
     */
    resetToDefault(): Promise<boolean>;
    /**
     * 🆔 Get user ID for audit logging
     */
    getUserId(): string;
    /**
     * 🏢 Get workspace ID for audit logging
     */
    getWorkspaceId(): string;
    /**
     * 🧹 Cleanup resources
     */
    dispose(): Promise<void>;
}
import Logger = require("../utils/logger");
import AuditLogger = require("../enterprise/auditLogger");
import PerformanceMonitor = require("./performanceMonitor");
//# sourceMappingURL=enterpriseThemeService.d.ts.map