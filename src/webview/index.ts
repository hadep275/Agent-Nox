/**
 * 🦊 Nox Webview Entry Point
 * Enterprise-grade webview bundle entry point
 */

// Import enterprise styles (will be processed by webpack)
import './styles.css';
import './markdown-styles.css';

// Import markdown test module
import { MarkdownTester } from './markdown-test';
import { NoxMarkdownRenderer } from './markdown-renderer';

// Import types and components
import {
  VSCodeAPI,
  ChatMessage,
  WebviewState,
  BaseMessage,
  SendMessageRequest,
  ProviderChangeRequest,
  ModelChangeRequest,
  ClearHistoryRequest,
  ReadyMessage,
  GetProviderStatusRequest
} from './types';

import {
  MessageComponent,
  ProviderSelectorComponent,
  ModelSelectorComponent,
  ThinkingIndicatorComponent
} from './components';

// VS Code API
declare const acquireVsCodeApi: () => VSCodeAPI;

/**
 * Main Nox Chat Application
 * Enterprise-grade chat interface with modular architecture
 */
class NoxChatApp {
  private vscode: VSCodeAPI;
  private state: WebviewState;
  private elements: {
    messagesContainer?: HTMLElement;
    messageInput?: HTMLTextAreaElement;
    sendBtn?: HTMLButtonElement;
    thinkingIndicator?: HTMLElement;
    providerControls?: HTMLElement;
    sessionCost?: HTMLElement;
    sessionTokens?: HTMLElement;
  } = {};

  constructor() {
    this.vscode = acquireVsCodeApi();
    this.state = this.initializeState();
    this.initialize();
  }

  private initializeState(): WebviewState {
    return {
      chatHistory: [],
      sessionStats: {
        totalTokens: 0,
        totalCost: 0,
        messageCount: 0,
        startTime: new Date().toISOString()
      },
      currentProvider: 'anthropic',
      currentModel: 'claude-sonnet-4-5-20250929',
      isAIResponding: false
    };
  }

  private initialize(): void {
    // Test markdown libraries
    this.testMarkdownLibraries();

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupUI();
      });
    } else {
      this.setupUI();
    }
  }

  private testMarkdownLibraries(): void {
    console.log('🧪 Testing markdown libraries...');
    const testsPassed = MarkdownTester.runAllTests();

    if (testsPassed) {
      console.log('✅ All markdown libraries ready for enterprise use');
    } else {
      console.error('❌ Markdown library tests failed');
    }
  }

  private setupUI(): void {
    // Get DOM elements
    this.elements.messagesContainer = document.getElementById('messagesContainer') as HTMLElement;
    this.elements.messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
    this.elements.sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    this.elements.sessionCost = document.getElementById('sessionCost') as HTMLElement;
    this.elements.sessionTokens = document.getElementById('sessionTokens') as HTMLElement;

    // Setup event listeners
    this.setupEventListeners();

    // Setup message handling
    this.setupMessageHandling();

    // Request initial data from extension
    this.sendMessage({ type: 'ready' });
    this.sendMessage({ type: 'getProviderStatus' });


  }

  private setupEventListeners(): void {
    // Send button click
    this.elements.sendBtn?.addEventListener('click', () => {
      this.sendUserMessage();
    });

    // Enter key to send (Shift+Enter for new line)
    this.elements.messageInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendUserMessage();
      }
    });

    // Auto-resize textarea
    this.elements.messageInput?.addEventListener('input', () => {
      this.autoResizeTextarea();
    });

    // Provider change handler
    const providerSelect = document.getElementById('providerSelect') as HTMLSelectElement;
    providerSelect?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.sendMessage({
        type: 'changeProvider',
        provider: target.value
      } as ProviderChangeRequest);
    });

    // Model change handler
    const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
    modelSelect?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.sendMessage({
        type: 'changeModel',
        model: target.value
      } as ModelChangeRequest);
    });

    // Header controls
    this.setupHeaderControls();
  }

  private setupHeaderControls(): void {
    // Header controls are now handled by VS Code native header
    // Toggle functionality is handled via extension message in handleExtensionMessage()
    console.log('🦊 Header controls setup - using VS Code native header');
  }

  private toggleProviderSection(): void {
    console.log('🦊 Toggle provider section called');
    const providerControls = document.getElementById('providerControls') as HTMLElement;

    if (!providerControls) {
      console.log('🦊 Provider controls element not found');
      return;
    }

    const isCollapsed = providerControls.classList.contains('collapsed');
    console.log('🦊 Current collapsed state:', isCollapsed);

    if (isCollapsed) {
      providerControls.classList.remove('collapsed');
      console.log('🦊 Expanded provider section');
    } else {
      providerControls.classList.add('collapsed');
      console.log('🦊 Collapsed provider section');
    }

    // Send the new state back to extension for button icon update
    this.sendMessage({
      type: 'providerSectionToggled',
      collapsed: !isCollapsed
    } as any);
  }

  private clearChat(): void {
    // Clear the messages container
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="welcome-message">
          <div class="fox-welcome">🦊</div>
          <div class="welcome-text">
            <h3>Welcome to Nox!</h3>
            <p>Your clever AI coding fox is ready to help.</p>
            <div class="bundled-indicator">✨ Enterprise Bundle</div>
          </div>
        </div>
      `;
    }

    // Reset session stats
    this.resetSessionStats();

    // Notify extension to clear chat history
    this.sendMessage({ type: 'clearChat' });
  }

  private setupMessageHandling(): void {
    window.addEventListener('message', (event) => {
      this.handleExtensionMessage(event.data);
    });
  }

  private sendMessage(message: BaseMessage): void {
    this.vscode.postMessage(message);
  }

  private sendUserMessage(): void {
    const message = this.elements.messageInput?.value.trim();

    if (!message || this.state.isAIResponding) {
      return;
    }

    // Send to extension
    const request: SendMessageRequest = {
      type: 'sendMessage',
      content: message
    };

    this.sendMessage(request);

    // Clear input
    if (this.elements.messageInput) {
      this.elements.messageInput.value = '';
      this.autoResizeTextarea();
    }
  }

  private autoResizeTextarea(): void {
    if (this.elements.messageInput) {
      this.elements.messageInput.style.height = 'auto';
      this.elements.messageInput.style.height =
        Math.min(this.elements.messageInput.scrollHeight, 100) + 'px';
    }
  }

  private handleExtensionMessage(message: any): void {
    switch (message.type) {
      case 'userMessage':
        this.addMessage(message.message);
        break;

      case 'aiMessage':
        this.addMessage(message.message);
        this.updateSessionStats(message.message.tokens, message.message.cost);
        this.state.isAIResponding = false;
        break;

      case 'aiThinking':
        this.showThinking(message.thinking);
        this.state.isAIResponding = message.thinking;
        break;

      case 'error':
        this.showError(message.message);
        this.state.isAIResponding = false;
        break;

      case 'clearMessages':
        this.clearMessages();
        this.resetSessionStats();
        break;

      case 'loadHistory':
        this.loadHistory(message.history);
        break;

      case 'providerStatus':
        this.updateProviderStatus(message);
        break;

      case 'messageDeleted':
        this.removeMessage(message.messageId);
        break;

      case 'messageRegenerated':
        this.replaceMessage(message.oldMessageId, message.newMessage);
        break;

      case 'toggleProviderSection':
        this.toggleProviderSection();
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Remove a message from the chat
   */
  private removeMessage(messageId: string): void {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
      messageEl.remove();
      // Remove from state
      this.state.chatHistory = this.state.chatHistory.filter(msg => msg.id !== messageId);
    }
  }

  /**
   * Replace a message with a new one (for regeneration)
   */
  private replaceMessage(oldMessageId: string, newMessage: ChatMessage): void {
    const oldMessageEl = document.querySelector(`[data-message-id="${oldMessageId}"]`);
    if (oldMessageEl) {
      const newMessageEl = MessageComponent.create({ message: newMessage });
      oldMessageEl.parentNode?.replaceChild(newMessageEl, oldMessageEl);

      // Update state
      const index = this.state.chatHistory.findIndex(msg => msg.id === oldMessageId);
      if (index !== -1) {
        this.state.chatHistory[index] = newMessage;
      }
    }
  }

  /**
   * Reset session statistics
   */
  private resetSessionStats(): void {
    this.state.sessionStats = {
      totalTokens: 0,
      totalCost: 0,
      messageCount: 0,
      startTime: new Date().toISOString()
    };

    if (this.elements.sessionTokens) {
      this.elements.sessionTokens.textContent = '0';
    }

    if (this.elements.sessionCost) {
      this.elements.sessionCost.textContent = '$0.00';
    }

    // Remove session summary
    const summaryEl = document.getElementById('sessionSummary');
    if (summaryEl) {
      summaryEl.remove();
    }
  }

  private addMessage(message: ChatMessage): void {
    if (!this.elements.messagesContainer) return;

    const messageEl = MessageComponent.create({ message });
    this.elements.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();

    // Update state
    this.state.chatHistory.push(message);
  }

  private showThinking(show: boolean): void {
    if (!this.elements.thinkingIndicator) {
      this.elements.thinkingIndicator = ThinkingIndicatorComponent.create();
      this.elements.messagesContainer?.appendChild(this.elements.thinkingIndicator);
    }

    this.elements.thinkingIndicator.style.display = show ? 'flex' : 'none';
    if (show) {
      this.scrollToBottom();
    }
  }

  private showError(error: string): void {
    if (!this.elements.messagesContainer) return;

    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = error;

    this.elements.messagesContainer.appendChild(errorEl);
    this.scrollToBottom();

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorEl.parentNode) {
        errorEl.parentNode.removeChild(errorEl);
      }
    }, 5000);
  }

  private clearMessages(): void {
    if (!this.elements.messagesContainer) return;

    // Keep welcome message, remove others
    const welcomeMsg = this.elements.messagesContainer.querySelector('.welcome-message');
    this.elements.messagesContainer.innerHTML = '';
    if (welcomeMsg) {
      this.elements.messagesContainer.appendChild(welcomeMsg);
    }

    this.state.chatHistory = [];
  }

  private loadHistory(history: ChatMessage[]): void {
    this.clearMessages();
    history.forEach(msg => this.addMessage(msg));
    this.state.chatHistory = [...history];
  }

  private updateProviderStatus(data: any): void {
    // Validate data structure with detailed logging
    if (!data) {
      console.warn('🦊 No data received for provider status');
      return;
    }

    if (!data.currentProvider) {
      console.warn('🦊 Missing currentProvider in data:', data);
      console.warn('🦊 Available properties:', Object.keys(data));
      return;
    }

    if (!data.providers) {
      console.warn('🦊 Missing providers in data:', data);
      return;
    }

    // First, populate the provider dropdown with all available providers
    this.populateProviderDropdown(data.providers, data.currentProvider);

    // Get current provider data
    const currentProviderData = data.providers[data.currentProvider];
    if (!currentProviderData) {
      console.warn('🦊 No data found for current provider:', data.currentProvider);
      return;
    }

    // Update model dropdown with current provider's models
    this.updateModelDropdown(currentProviderData, data.currentModel);

    // Update status indicator
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');

    if (statusIndicator && statusText) {
      if (currentProviderData.hasApiKey) {
        statusIndicator.className = 'status-indicator';
        statusText.textContent = 'Ready';
      } else {
        statusIndicator.className = 'status-indicator error';
        statusText.textContent = 'No API Key';
      }
    }
  }

  private populateProviderDropdown(providers: any, currentProvider: string): void {
    const providerSelect = document.getElementById('providerSelect') as HTMLSelectElement;
    if (!providerSelect) {
      console.warn('🦊 Provider select element not found');
      return;
    }

    // Clear existing options
    providerSelect.innerHTML = '';

    // Add options for each provider
    Object.entries(providers).forEach(([providerId, providerData]: [string, any]) => {
      const option = document.createElement('option');
      option.value = providerId;
      option.textContent = providerData.name || providerId;

      if (providerId === currentProvider) {
        option.selected = true;
      }

      providerSelect.appendChild(option);
    });


  }

  private updateModelDropdown(provider: any, currentModel: string): void {
    const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
    if (!modelSelect) return;

    // Check if provider exists and has models
    if (!provider || !provider.models || !Array.isArray(provider.models)) {
      console.warn('🦊 Invalid provider data for model dropdown:', provider);
      modelSelect.innerHTML = '<option value="">No models available</option>';
      return;
    }

    // Clear existing options
    modelSelect.innerHTML = '';

    // Add model options
    provider.models.forEach((model: string) => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = this.getModelDisplayName(model);
      if (model === currentModel) {
        option.selected = true;
      }
      modelSelect.appendChild(option);
    });
  }

  private getModelDisplayName(model: string): string {
    const modelNames: Record<string, string> = {
      'claude-sonnet-4-5-20250929': 'Claude Sonnet 4.5',
      'claude-sonnet-4-20250514': 'Claude Sonnet 4',
      'claude-3-5-haiku-20241022': 'Claude Haiku 3.5',
      'claude-3-haiku-20240307': 'Claude Haiku 3',
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'deepseek-chat': 'DeepSeek Chat',
      'deepseek-coder': 'DeepSeek Coder',
      'ollama': 'Ollama',
      'lm-studio': 'LM Studio'
    };
    return modelNames[model] || model;
  }

  private updateSessionStats(tokens: number = 0, cost: number = 0): void {
    this.state.sessionStats.totalTokens += tokens;
    this.state.sessionStats.totalCost += cost;
    this.state.sessionStats.messageCount += 1;

    if (this.elements.sessionTokens) {
      this.elements.sessionTokens.textContent = this.state.sessionStats.totalTokens.toLocaleString();
    }

    if (this.elements.sessionCost) {
      this.elements.sessionCost.textContent = '$' + this.state.sessionStats.totalCost.toFixed(4);
    }

    // Update session summary if it exists
    this.updateSessionSummary();
  }

  /**
   * Update session summary display
   */
  private updateSessionSummary(): void {
    let summaryEl = document.getElementById('sessionSummary');
    if (!summaryEl) {
      // Create session summary element
      summaryEl = document.createElement('div');
      summaryEl.id = 'sessionSummary';
      summaryEl.className = 'session-summary';

      // Insert after cost tracker
      const costTracker = document.getElementById('costTracker');
      if (costTracker && costTracker.parentNode) {
        costTracker.parentNode.insertBefore(summaryEl, costTracker.nextSibling);
      }
    }

    const sessionDuration = this.getSessionDuration();
    const avgCostPerMessage = this.state.sessionStats.messageCount > 0
      ? (this.state.sessionStats.totalCost / this.state.sessionStats.messageCount).toFixed(4)
      : '0.0000';

    summaryEl.innerHTML = `
      <span class="session-messages">${this.state.sessionStats.messageCount} messages</span>
      <span>•</span>
      <span>${sessionDuration}</span>
      <span>•</span>
      <span>$${avgCostPerMessage}/msg avg</span>
    `;
  }

  /**
   * Get formatted session duration
   */
  private getSessionDuration(): string {
    const startTime = new Date(this.state.sessionStats.startTime);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.elements.messagesContainer) {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
      }
    }, 100);
  }
}

// Initialize the app when the script loads
new NoxChatApp();

// Test markdown rendering on load

const renderer = NoxMarkdownRenderer.getInstance();
const testMarkdown = `
# 🦊 Nox Markdown Test

This is a **bold** test with *italic* text and \`inline code\`.

## Code Block Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}! 🦊\`);
  return \`Welcome to Nox!\`;
}

greet('Developer');
\`\`\`

## Features

- ✅ **Syntax highlighting** for 190+ languages
- ✅ **Aurora theming** with beautiful colors
- ✅ **Interactive code blocks** with copy buttons
- ✅ **XSS protection** with DOMPurify

> This is a blockquote with Aurora styling!

[Visit Augment Code](https://augmentcode.com) for more enterprise tools.
`;

const rendered = renderer.render(testMarkdown);

