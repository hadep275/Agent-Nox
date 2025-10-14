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
        break;

      case 'loadHistory':
        this.loadHistory(message.history);
        break;

      case 'providerStatus':
        this.updateProviderStatus(message);
        break;

      default:
        console.warn('Unknown message type:', message.type);
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

    if (this.elements.sessionTokens) {
      this.elements.sessionTokens.textContent = this.state.sessionStats.totalTokens.toLocaleString();
    }

    if (this.elements.sessionCost) {
      this.elements.sessionCost.textContent = '$' + this.state.sessionStats.totalCost.toFixed(4);
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

