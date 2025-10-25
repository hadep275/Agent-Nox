export = NoxModalSystem;
/**
 * 🦊 NOX Modal System - Scalable, reusable modal management for all NOX modals
 * Supports: Approvals, Confirmations, Alerts, Custom Modals
 * Designed for enterprise-grade extensibility
 */
declare class NoxModalSystem {
    modals: Map<any, any>;
    modalStack: any[];
    modalCounter: number;
    callbacks: Map<any, any>;
    /**
     * 🎨 Setup modal styles (injected into webview)
     */
    setupStyles(): void;
    /**
     * 🔐 Show approval modal
     */
    showApprovalModal(options: any): Promise<any>;
    /**
     * ✅ Show confirmation modal
     */
    showConfirmationModal(options: any): Promise<any>;
    /**
     * ℹ️ Show info modal
     */
    showInfoModal(options: any): Promise<any>;
    /**
     * 🎨 Create custom modal
     */
    createModal(options: any): string;
    /**
     * 🔍 Show details modal
     */
    showDetailsModal(details: any, parentModalId: any): void;
    /**
     * ❌ Close modal
     */
    closeModal(modalId: any): void;
    /**
     * 🔐 Create approval body HTML
     */
    createApprovalBody(description: any, details: any, riskLevel: any): string;
}
//# sourceMappingURL=noxModalSystem.d.ts.map