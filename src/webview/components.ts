/**
 * 🦊 Nox Webview Components
 * Enterprise-grade UI components for chat interface
 */

import { ChatMessage, CodeBlockProps, MessageComponentProps } from './types';
import { NoxMarkdownRenderer } from './markdown-renderer';

/**
 * Message Component Factory
 */
export class MessageComponent {
  
  /**
   * Create a message element with markdown rendering
   */
  static create(props: MessageComponentProps): HTMLElement {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${props.message.type}`;
    messageEl.setAttribute('data-message-id', props.message.id);

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';

    // Use markdown rendering for assistant messages, plain text for user messages
    if (props.message.type === 'assistant') {
      const renderer = NoxMarkdownRenderer.getInstance();
      const markdownContainer = document.createElement('div');
      markdownContainer.className = 'nox-markdown';
      markdownContainer.innerHTML = renderer.render(props.message.content);
      contentEl.appendChild(markdownContainer);
    } else {
      // User messages remain as plain text for clean appearance
      contentEl.textContent = props.message.content;
    }

    const metaEl = this.createMessageMeta(props.message);

    messageEl.appendChild(contentEl);
    messageEl.appendChild(metaEl);

    return messageEl;
  }

  /**
   * Create message metadata element with enhanced info and actions
   */
  private static createMessageMeta(message: ChatMessage): HTMLElement {
    const metaEl = document.createElement('div');
    metaEl.className = 'message-meta';

    // Create info section
    const infoEl = document.createElement('div');
    infoEl.className = 'message-info';

    // Enhanced date/time formatting
    const messageDate = new Date(message.timestamp);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === messageDate.toDateString();

    let timeText: string;
    let dateText: string = '';

    // Format time
    const timeFormatted = messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Format date based on recency
    if (isToday) {
      timeText = timeFormatted;
    } else if (isYesterday) {
      timeText = timeFormatted;
      dateText = 'Yesterday';
    } else {
      timeText = timeFormatted;
      dateText = messageDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }

    // Time element
    const timeEl = document.createElement('span');
    timeEl.className = 'message-time';
    timeEl.textContent = timeText;
    timeEl.title = messageDate.toLocaleString(); // Full timestamp on hover
    infoEl.appendChild(timeEl);

    // Date element (if not today)
    if (dateText) {
      const dateEl = document.createElement('span');
      dateEl.className = 'message-date';
      dateEl.textContent = dateText;
      dateEl.title = messageDate.toLocaleDateString();
      infoEl.appendChild(dateEl);
    }

    // Assistant-specific metadata
    if (message.type === 'assistant') {
      // Provider badge
      if (message.provider) {
        const providerEl = document.createElement('span');
        providerEl.className = 'message-provider';
        providerEl.textContent = message.provider;
        infoEl.appendChild(providerEl);
      }

      // Tokens badge
      if (message.tokens) {
        const tokensEl = document.createElement('span');
        tokensEl.className = 'message-tokens';
        tokensEl.textContent = `${message.tokens} tokens`;
        infoEl.appendChild(tokensEl);
      }

      // Cost badge
      if (message.cost) {
        const costEl = document.createElement('span');
        costEl.className = 'message-cost';
        costEl.textContent = `$${message.cost.toFixed(4)}`;
        infoEl.appendChild(costEl);
      }

      // Model info (smaller, less prominent)
      if (message.model) {
        const modelEl = document.createElement('span');
        modelEl.className = 'message-model';
        modelEl.textContent = message.model;
        modelEl.style.fontSize = '8px';
        modelEl.style.opacity = '0.6';
        infoEl.appendChild(modelEl);
      }
    }

    // Create actions section
    const actionsEl = document.createElement('div');
    actionsEl.className = 'message-actions';

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'message-action-btn copy';
    copyBtn.textContent = '📋 Copy';
    copyBtn.title = 'Copy message content';
    copyBtn.onclick = () => this.copyMessageContent(message);
    actionsEl.appendChild(copyBtn);

    // Regenerate button (only for assistant messages)
    if (message.type === 'assistant') {
      const regenerateBtn = document.createElement('button');
      regenerateBtn.className = 'message-action-btn regenerate';
      regenerateBtn.textContent = '🔄 Regenerate';
      regenerateBtn.title = 'Regenerate this response';
      regenerateBtn.onclick = () => this.regenerateMessage(message);
      actionsEl.appendChild(regenerateBtn);
    }

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'message-action-btn delete';
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.title = 'Delete this message';
    deleteBtn.onclick = () => this.deleteMessage(message);
    actionsEl.appendChild(deleteBtn);

    metaEl.appendChild(infoEl);
    metaEl.appendChild(actionsEl);

    return metaEl;
  }

  /**
   * Copy message content to clipboard
   */
  private static copyMessageContent(message: ChatMessage): void {
    navigator.clipboard.writeText(message.content).then(() => {
      // Show temporary feedback
      const notification = document.createElement('div');
      notification.textContent = '✅ Copied to clipboard';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--aurora-green);
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 1000;
        animation: fadeInOut 2s ease-in-out;
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  /**
   * Regenerate assistant message
   */
  private static regenerateMessage(message: ChatMessage): void {
    // Send message to extension to regenerate
    // Note: Use the global vscode API that's already acquired
    const vscode = (window as any).vscodeApi || (window as any).acquireVsCodeApi();
    vscode.postMessage({
      type: 'regenerateMessage',
      messageId: message.id
    });
  }

  /**
   * Delete message
   */
  private static deleteMessage(message: ChatMessage): void {
    // Show confirmation via extension instead of browser confirm (which is blocked in sandboxed webview)
    const vscode = (window as any).vscodeApi || (window as any).acquireVsCodeApi();
    vscode.postMessage({
      type: 'confirmDelete',
      messageId: message.id
    });
  }
}

/**
 * Code Block Component (placeholder for Phase 4)
 */
export class CodeBlockComponent {
  
  static create(props: CodeBlockProps): HTMLElement {
    const codeBlockEl = document.createElement('div');
    codeBlockEl.className = 'code-block';
    
    const preEl = document.createElement('pre');
    const codeEl = document.createElement('code');
    codeEl.textContent = props.code;
    codeEl.className = `language-${props.language}`;
    
    preEl.appendChild(codeEl);
    codeBlockEl.appendChild(preEl);
    
    if (props.copyable) {
      const copyBtn = this.createCopyButton(props.code);
      codeBlockEl.appendChild(copyBtn);
    }
    
    return codeBlockEl;
  }
  
  private static createCopyButton(code: string): HTMLElement {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '📋';
    copyBtn.title = 'Copy code';
    
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.textContent = '✅';
        setTimeout(() => {
          copyBtn.textContent = '📋';
        }, 2000);
      });
    });
    
    return copyBtn;
  }
}

/**
 * Provider Selector Component
 */
export class ProviderSelectorComponent {
  
  static create(
    currentProvider: string,
    providers: Record<string, any>,
    onProviderChange: (provider: string) => void
  ): HTMLElement {
    const selectorEl = document.createElement('div');
    selectorEl.className = 'provider-selector';

    const labelEl = document.createElement('label');
    labelEl.textContent = '🤖 Provider:';
    labelEl.setAttribute('for', 'providerSelect');

    const selectEl = document.createElement('select');
    selectEl.id = 'providerSelect';
    selectEl.className = 'provider-dropdown';

    // Add provider options
    Object.entries(providers).forEach(([providerId, provider]) => {
      const optionEl = document.createElement('option');
      optionEl.value = providerId;
      optionEl.textContent = provider.name;
      if (providerId === currentProvider) {
        optionEl.selected = true;
      }
      selectEl.appendChild(optionEl);
    });

    // Add event listener
    selectEl.addEventListener('change', () => {
      onProviderChange(selectEl.value);
    });

    const statusEl = document.createElement('div');
    statusEl.className = 'provider-status';
    statusEl.id = 'providerStatus';

    const indicatorEl = document.createElement('span');
    indicatorEl.className = 'status-indicator';
    indicatorEl.id = 'statusIndicator';
    indicatorEl.textContent = '●';

    const textEl = document.createElement('span');
    textEl.className = 'status-text';
    textEl.id = 'statusText';
    textEl.textContent = 'Ready';

    statusEl.appendChild(indicatorEl);
    statusEl.appendChild(textEl);

    selectorEl.appendChild(labelEl);
    selectorEl.appendChild(selectEl);
    selectorEl.appendChild(statusEl);

    return selectorEl;
  }
}

/**
 * Model Selector Component
 */
export class ModelSelectorComponent {
  
  static create(
    currentModel: string,
    models: string[],
    onModelChange: (model: string) => void
  ): HTMLElement {
    const selectorEl = document.createElement('div');
    selectorEl.className = 'model-selector';

    const labelEl = document.createElement('label');
    labelEl.textContent = '🧠 Model:';
    labelEl.setAttribute('for', 'modelSelect');

    const selectEl = document.createElement('select');
    selectEl.id = 'modelSelect';
    selectEl.className = 'model-dropdown';

    // Add model options
    models.forEach(model => {
      const optionEl = document.createElement('option');
      optionEl.value = model;
      optionEl.textContent = this.getModelDisplayName(model);
      if (model === currentModel) {
        optionEl.selected = true;
      }
      selectEl.appendChild(optionEl);
    });

    // Add event listener
    selectEl.addEventListener('change', () => {
      onModelChange(selectEl.value);
    });

    selectorEl.appendChild(labelEl);
    selectorEl.appendChild(selectEl);

    return selectorEl;
  }

  private static getModelDisplayName(model: string): string {
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
}

/**
 * Thinking Indicator Component
 */
export class ThinkingIndicatorComponent {
  
  static create(): HTMLElement {
    const thinkingEl = document.createElement('div');
    thinkingEl.className = 'thinking-indicator';
    thinkingEl.id = 'thinkingIndicator';
    thinkingEl.style.display = 'none';

    const contentEl = document.createElement('div');
    contentEl.className = 'thinking-content';

    const foxEl = document.createElement('span');
    foxEl.className = 'fox-thinking';
    foxEl.textContent = '🦊';

    const dotsEl = document.createElement('div');
    dotsEl.className = 'thinking-dots';
    for (let i = 0; i < 3; i++) {
      const dotEl = document.createElement('span');
      dotsEl.appendChild(dotEl);
    }

    const textEl = document.createElement('span');
    textEl.className = 'thinking-text';
    textEl.textContent = 'Thinking...';

    contentEl.appendChild(foxEl);
    contentEl.appendChild(dotsEl);
    contentEl.appendChild(textEl);
    thinkingEl.appendChild(contentEl);

    return thinkingEl;
  }
}
