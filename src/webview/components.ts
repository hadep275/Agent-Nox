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
   * Create message metadata element
   */
  private static createMessageMeta(message: ChatMessage): HTMLElement {
    const metaEl = document.createElement('div');
    metaEl.className = 'message-meta';

    const time = new Date(message.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (message.type === 'assistant') {
      const cost = message.cost ? ` • $${message.cost.toFixed(4)}` : '';
      const model = message.model ? ` • ${message.model}` : '';
      metaEl.textContent = `${time} • ${message.tokens || 0} tokens${cost} • ${message.provider || 'AI'}${model}`;
    } else {
      metaEl.textContent = time;
    }

    return metaEl;
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
