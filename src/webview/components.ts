/**
 * 🦊 Nox Webview Components
 * Enterprise-grade UI components for chat interface
 */

import { ChatMessage, CodeBlockProps, MessageComponentProps, VSCodeAPI } from './types';
import { NoxMarkdownRenderer } from './markdown-renderer';

// VS Code API for streaming communication
declare const acquireVsCodeApi: () => VSCodeAPI;

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
  static createMessageMeta(message: ChatMessage): HTMLElement {
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

/**
 * Smart streaming buffer for natural typing speed
 */
class StreamingBuffer {
  private buffer: string = '';
  private timer: NodeJS.Timeout | null = null;
  private messageId: string;
  private onFlush: (content: string) => void;
  public isStopped: boolean = false; // NEW: Track stopped state

  // Speed presets for natural typing experience
  private static readonly SPEED_PRESETS = {
    slow: { delay: 150, minChunk: 1, maxChunk: 2 },     // Very readable, careful
    medium: { delay: 80, minChunk: 1, maxChunk: 4 },    // Natural typing, slower
    fast: { delay: 40, minChunk: 2, maxChunk: 6 },      // Quick but smooth
    instant: { delay: 0, minChunk: 999, maxChunk: 999 } // Current behavior
  };

  private currentSpeed: keyof typeof StreamingBuffer.SPEED_PRESETS = 'medium';

  constructor(messageId: string, onFlush: (content: string) => void) {
    this.messageId = messageId;
    this.onFlush = onFlush;
  }

  /**
   * Add chunk to buffer with smart batching
   */
  addChunk(chunk: string): void {
    // NEW: Stop processing if buffer is stopped
    if (this.isStopped) {
      console.log(`🛑 Buffer stopped - ignoring chunk for message: ${this.messageId}`);
      return;
    }

    this.buffer += chunk;

    const preset = StreamingBuffer.SPEED_PRESETS[this.currentSpeed];

    // For instant mode, flush immediately
    if (preset.delay === 0) {
      this.flushBuffer();
      return;
    }

    // Batch chunks for smooth display
    if (this.buffer.length >= preset.minChunk && !this.timer) {
      this.scheduleFlush(preset.delay);
    } else if (this.buffer.length >= preset.maxChunk) {
      // Force flush if buffer gets too large
      this.flushBuffer();
    }
  }

  /**
   * Schedule buffer flush with natural timing
   */
  private scheduleFlush(delay: number): void {
    // NEW: Don't schedule if stopped
    if (this.isStopped) {
      return;
    }

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      // NEW: Check stopped state before flushing
      if (!this.isStopped) {
        this.flushBuffer();
      }
      this.timer = null;
    }, delay);
  }

  /**
   * Flush buffer to display
   */
  private flushBuffer(): void {
    if (this.buffer.trim()) {
      this.onFlush(this.buffer);
      this.buffer = '';
    }

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Force complete flush (for stream end)
   */
  complete(): void {
    this.flushBuffer();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.buffer = '';
  }

  /**
   * Set streaming speed
   */
  setSpeed(speed: keyof typeof StreamingBuffer.SPEED_PRESETS): void {
    this.currentSpeed = speed;
  }

  /**
   * NEW: Stop buffer processing immediately
   */
  stop(): void {
    console.log(`🛑 Stopping buffer for message: ${this.messageId}`);
    this.isStopped = true;

    // Clear any pending timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Flush any remaining content immediately
    if (this.buffer.length > 0) {
      this.flushBuffer();
    }
  }

  /**
   * NEW: Check if buffer is stopped
   */
  isBufferStopped(): boolean {
    return this.isStopped;
  }
}

/**
 * Streaming Message Component
 * Handles real-time streaming AI responses with progress indicators
 */
export class StreamingMessageComponent {
  private static activeBuffers = new Map<string, StreamingBuffer>();
  private static globalSpeed: keyof typeof StreamingBuffer['SPEED_PRESETS'] = 'medium';
  private static userHasScrolled = false;
  private static lastScrollTime = 0;
  private static markdownRenderTimers = new Map<string, NodeJS.Timeout>();
  private static lastMarkdownRender = new Map<string, number>();
  private static autoScrollDisabled = false; // User can disable auto-scroll completely

  /**
   * Create a streaming message element with progress indicators and stop button
   */
  static create(messageId: string): HTMLElement {
    const messageEl = document.createElement('div');
    messageEl.className = 'message assistant streaming';
    messageEl.setAttribute('data-message-id', messageId);
    messageEl.setAttribute('data-streaming', 'true');

    // Message header with status and stop button
    const headerEl = document.createElement('div');
    headerEl.className = 'streaming-header';

    const statusEl = document.createElement('span');
    statusEl.className = 'streaming-status';
    statusEl.innerHTML = '🤖 Assistant <span class="streaming-badge">STREAMING</span>';

    const stopBtn = document.createElement('button');
    stopBtn.className = 'stream-stop-btn';
    stopBtn.innerHTML = '⏹️ Stop';
    stopBtn.title = 'Stop generating response';
    stopBtn.onclick = () => this.stopStreaming(messageId);

    headerEl.appendChild(statusEl);
    headerEl.appendChild(stopBtn);

    // Content area with streaming text and cursor
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content streaming-content';

    const textEl = document.createElement('div');
    textEl.className = 'streaming-text nox-markdown';
    textEl.textContent = ''; // Start empty

    const cursorEl = document.createElement('span');
    cursorEl.className = 'streaming-cursor';
    cursorEl.textContent = '█';

    contentEl.appendChild(textEl);
    contentEl.appendChild(cursorEl);

    // Progress bar section
    const progressEl = document.createElement('div');
    progressEl.className = 'streaming-progress';
    progressEl.innerHTML = `
      <div class="progress-info">
        <span class="progress-text">🔄 Generating response...</span>
        <span class="token-count">0 tokens</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    `;

    messageEl.appendChild(headerEl);
    messageEl.appendChild(contentEl);
    messageEl.appendChild(progressEl);

    return messageEl;
  }

  /**
   * Update streaming message content with new chunk using smart buffering
   */
  static updateContent(messageId: string, chunk: string, tokens?: number): void {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageEl || !messageEl.hasAttribute('data-streaming')) return;

    // Get or create buffer for this message
    let buffer = this.activeBuffers.get(messageId);
    if (!buffer) {
      buffer = new StreamingBuffer(messageId, (content: string) => {
        this.flushContentToDisplay(messageId, content);
      });
      buffer.setSpeed(this.globalSpeed); // Use global speed setting
      this.activeBuffers.set(messageId, buffer);
    }

    // If buffer is stopped, don't process new chunks (stream was stopped by user)
    if (buffer.isStopped) {
      console.log(`🛑 Buffer is stopped - ignoring chunk for message: ${messageId}`);
      return;
    }

    // Add chunk to buffer for natural typing speed
    buffer.addChunk(chunk);

    // Update token count and progress (less frequently for better performance)
    if (tokens && Math.random() < 0.3) { // Update ~30% of the time to reduce flicker
      this.updateProgress(messageId, tokens);
    }
  }

  /**
   * Flush buffered content to display (called by StreamingBuffer)
   */
  private static flushContentToDisplay(messageId: string, content: string): void {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageEl || !messageEl.hasAttribute('data-streaming')) return;

    const textEl = messageEl.querySelector('.streaming-text') as HTMLElement;
    if (!textEl) return;

    // PURE SEQUENTIAL STREAMING: Only append text, NO markdown rendering during streaming
    // This ensures perfect line-by-line, character-by-character streaming
    textEl.textContent += content;

    // NO markdown rendering during streaming - this causes the chaos!
    // Markdown will only be rendered when streaming completes

    // ONLY expand container - NO auto-scroll logic during streaming
    this.expandContainerOnly(messageEl as HTMLElement, textEl);
  }

  /**
   * TEMPORARILY DISABLED FOR TESTING: Schedule smart markdown rendering
   */
  private static scheduleSmartMarkdownRender(messageId: string, textEl: HTMLElement): void {
    // DISABLED FOR TESTING: No markdown rendering during streaming
    // This will help us isolate if the chaos is caused by markdown rendering
    // or by something else in the streaming process
    console.log('🧪 TESTING: Markdown rendering call blocked');
  }

  /**
   * TEMPORARILY DISABLED FOR TESTING: Render markdown safely
   */
  private static renderMarkdownSafely(messageId: string, textEl: HTMLElement): void {
    // DISABLED FOR TESTING: No markdown rendering
    console.log('🧪 TESTING: Markdown rendering blocked');
  }

  /**
   * Update progress indicators
   */
  private static updateProgress(messageId: string, tokens: number): void {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageEl) return;

    const tokenEl = messageEl.querySelector('.token-count') as HTMLElement;
    const progressFill = messageEl.querySelector('.progress-fill') as HTMLElement;

    if (tokenEl && tokens) {
      tokenEl.textContent = `${tokens} tokens`;
    }

    // Update progress bar (estimate based on tokens)
    if (progressFill && tokens) {
      // Rough estimate: assume 4000 max tokens, show progress
      const estimatedProgress = Math.min((tokens / 4000) * 100, 95); // Cap at 95% until complete
      progressFill.style.width = `${estimatedProgress}%`;
    }
  }

  /**
   * Complete streaming and convert to regular message
   */
  static completeStreaming(messageId: string, finalMessage: ChatMessage): void {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageEl || !messageEl.hasAttribute('data-streaming')) return;

    // Complete and clean up buffer
    const buffer = this.activeBuffers.get(messageId);
    if (buffer) {
      buffer.complete(); // Flush any remaining content
      buffer.destroy();  // Clean up resources
      this.activeBuffers.delete(messageId);
    }

    // Clean up markdown render timers
    const timer = this.markdownRenderTimers.get(messageId);
    if (timer) {
      clearTimeout(timer);
      this.markdownRenderTimers.delete(messageId);
    }
    this.lastMarkdownRender.delete(messageId);

    // TEMPORARILY DISABLED: Final markdown render for testing
    // const textEl = messageEl.querySelector('.streaming-text') as HTMLElement;
    // if (textEl && finalMessage.content) {
    //   const renderer = NoxMarkdownRenderer.getInstance();
    //   textEl.innerHTML = renderer.render(finalMessage.content);
    // }

    // FOR TESTING: Keep as plain text to see if chaos still happens
    console.log('🧪 TESTING: Markdown rendering disabled to isolate streaming chaos issue');

    // Remove streaming attributes and classes
    messageEl.removeAttribute('data-streaming');
    messageEl.classList.remove('streaming');

    // OPTIONAL: Scroll to bottom only if user was following along
    // This is gentle and only happens once when streaming completes
    this.optionalScrollToBottomOnComplete();

    // Re-enable auto-scroll for next streaming session
    this.autoScrollDisabled = false;

    // Remove streaming-specific elements
    const headerEl = messageEl.querySelector('.streaming-header');
    const progressEl = messageEl.querySelector('.streaming-progress');
    const cursorEl = messageEl.querySelector('.streaming-cursor');

    if (headerEl) headerEl.remove();
    if (progressEl) progressEl.remove();
    if (cursorEl) cursorEl.remove();

    // Update content with final rendered markdown
    const contentEl = messageEl.querySelector('.message-content');
    if (contentEl) {
      contentEl.className = 'message-content'; // Remove streaming class

      const textEl = contentEl.querySelector('.streaming-text');
      if (textEl) {
        textEl.className = 'nox-markdown'; // Remove streaming class

        // Final markdown render
        const renderer = NoxMarkdownRenderer.getInstance();
        textEl.innerHTML = renderer.render(finalMessage.content);
      }
    }

    // Add final message metadata
    const metaEl = MessageComponent.createMessageMeta(finalMessage);
    messageEl.appendChild(metaEl);

    // Update message ID to match final message
    messageEl.setAttribute('data-message-id', finalMessage.id);

    // Hide scroll indicator when streaming completes
    this.hideScrollIndicator();
  }

  /**
   * NEW: Stop streaming buffer immediately
   */
  static stopStreamingBuffer(messageId: string): void {
    const buffer = this.activeBuffers.get(messageId);
    if (buffer) {
      console.log(`🛑 Stopping streaming buffer for message: ${messageId}`);
      buffer.stop();
    } else {
      console.warn(`🛑 No active buffer found for message: ${messageId}`);
    }
  }

  /**
   * NEW: Update stop/continue button state with immediate visual feedback
   */
  private static updateStopButtonState(messageId: string, state: 'stopping' | 'stopped' | 'continuing'): void {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageEl) {
      console.warn(`🛑 Message element not found for: ${messageId}`);
      return;
    }

    const stopBtn = messageEl.querySelector('.stream-stop-btn, .stream-continue-btn') as HTMLButtonElement;
    const progressText = messageEl.querySelector('.progress-text') as HTMLElement;
    const cursorEl = messageEl.querySelector('.streaming-cursor') as HTMLElement;

    if (!stopBtn) {
      console.warn(`🛑 Stop button not found for: ${messageId}`);
      return;
    }

    console.log(`🛑 Updating button state to: ${state} for message: ${messageId}`);

    switch (state) {
      case 'stopping':
        stopBtn.disabled = true;
        stopBtn.innerHTML = '⏸️ Stopping...';
        stopBtn.title = 'Stopping generation...';
        if (progressText) {
          progressText.textContent = '⏸️ Stopping generation...';
        }
        // Hide cursor immediately
        if (cursorEl) {
          cursorEl.style.display = 'none';
        }
        // Stop any progress animations
        const progressContainer = messageEl.querySelector('.progress-container') as HTMLElement;
        if (progressContainer) {
          progressContainer.style.display = 'none';
        }
        break;

      case 'stopped':
        stopBtn.disabled = false;
        stopBtn.innerHTML = '▶️ Continue';
        stopBtn.title = 'Continue generating response';
        stopBtn.className = 'stream-continue-btn';
        stopBtn.onclick = () => this.continueStreaming(messageId);
        if (progressText) {
          progressText.textContent = '⏸️ Generation stopped - Click Continue to resume';
        }
        // Keep cursor hidden
        if (cursorEl) {
          cursorEl.style.display = 'none';
        }
        break;

      case 'continuing':
        stopBtn.disabled = true;
        stopBtn.innerHTML = '⏳ Resuming...';
        stopBtn.title = 'Resuming generation...';
        stopBtn.className = 'stream-stop-btn'; // Will change back to stop when streaming resumes
        if (progressText) {
          progressText.textContent = '⏳ Resuming generation...';
        }
        // Show cursor again
        if (cursorEl) {
          cursorEl.style.display = 'inline';
        }
        break;
    }
  }

  /**
   * Stop streaming request
   */
  private static stopStreaming(messageId: string): void {
    try {
      console.log(`🛑 FRONTEND: Stop streaming requested for message: ${messageId}`);

      // NEW: Stop buffer processing immediately
      this.stopStreamingBuffer(messageId);

      // NEW: Update UI immediately to show stopping state
      this.updateStopButtonState(messageId, 'stopping');

      const vscode = (window as any).vscodeApi || (window as any).acquireVsCodeApi();
      console.log(`🛑 FRONTEND: Sending streamStop message to backend for: ${messageId}`);

      vscode.postMessage({
        type: 'streamStop',
        messageId: messageId
      });

      console.log(`🛑 FRONTEND: streamStop message sent for: ${messageId}`);

    } catch (error) {
      console.error('🛑 FRONTEND: Failed to stop streaming:', error);
    }
  }

  /**
   * Handle streaming error
   */
  static handleStreamingError(messageId: string, error: string): void {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageEl || !messageEl.hasAttribute('data-streaming')) return;

    // Clean up buffer on error
    const buffer = this.activeBuffers.get(messageId);
    if (buffer) {
      buffer.complete(); // Flush any remaining content
      buffer.destroy();  // Clean up resources
      this.activeBuffers.delete(messageId);
    }

    // Clean up markdown render timers
    const timer = this.markdownRenderTimers.get(messageId);
    if (timer) {
      clearTimeout(timer);
      this.markdownRenderTimers.delete(messageId);
    }
    this.lastMarkdownRender.delete(messageId);

    // Update progress to show error
    const progressText = messageEl.querySelector('.progress-text') as HTMLElement;
    const stopBtn = messageEl.querySelector('.stream-stop-btn') as HTMLButtonElement;

    if (progressText) {
      progressText.innerHTML = '❌ Error occurred during streaming';
      progressText.style.color = '#ef4444';
    }

    if (stopBtn) {
      stopBtn.style.display = 'none';
    }

    // Add error message to content
    const textEl = messageEl.querySelector('.streaming-text') as HTMLElement;
    if (textEl) {
      textEl.innerHTML += `<div class="streaming-error">❌ ${error}</div>`;
    }
  }

  /**
   * ⏹️ Handle stream stopped - Update UI to show stopped state with continue option
   */
  static handleStreamStopped(messageId: string, partialContent?: string): void {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageEl || !messageEl.hasAttribute('data-streaming')) return;

    console.log('⏹️ Handling stream stopped for message:', messageId);

    // NEW: Stop buffer processing and clean up
    this.stopStreamingBuffer(messageId);

    // Flush any remaining content in buffer
    const buffer = this.activeBuffers.get(messageId);
    if (buffer) {
      buffer.complete(); // Flush remaining content
      // Don't destroy buffer yet - we might need to continue
    }

    // NEW: Update button state to stopped with continue option
    this.updateStopButtonState(messageId, 'stopped');

    // Update status to show stopped state
    const statusEl = messageEl.querySelector('.streaming-status');
    if (statusEl) {
      statusEl.innerHTML = '🤖 Assistant <span class="streaming-badge stopped">STOPPED</span>';
    }

    // Mark message as stopped (but still streaming-capable)
    messageEl.setAttribute('data-streaming-stopped', 'true');

    console.log('⏹️ Stream stopped UI updated for message:', messageId);
  }

  /**
   * ▶️ Continue streaming request
   */
  private static continueStreaming(messageId: string): void {
    try {
      console.log(`▶️ Continue streaming requested for message: ${messageId}`);

      // NEW: Update UI immediately to show continuing state
      this.updateStopButtonState(messageId, 'continuing');

      // Update status to show streaming again
      const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
      if (messageEl) {
        const statusEl = messageEl.querySelector('.streaming-status');
        if (statusEl) {
          statusEl.innerHTML = '🤖 Assistant <span class="streaming-badge">STREAMING</span>';
        }

        // Remove stopped attribute
        messageEl.removeAttribute('data-streaming-stopped');
      }

      // Reset buffer's stopped state so it can process new chunks
      const buffer = this.activeBuffers.get(messageId);
      if (buffer) {
        buffer.isStopped = false;
        console.log(`🔄 Resetting stopped buffer for explicit continue: ${messageId}`);
      }

      const vscode = (window as any).vscodeApi || (window as any).acquireVsCodeApi();
      vscode.postMessage({
        type: 'streamContinue',
        messageId: messageId
      });

    } catch (error) {
      console.error('Failed to continue streaming:', error);
    }
  }

  /**
   * SIMPLE: Only expand container, NO scroll interference during streaming
   */
  private static expandContainerOnly(messageEl: HTMLElement, textEl: HTMLElement): void {
    // Force height recalculation to accommodate new content
    messageEl.style.height = 'auto';
    textEl.style.height = 'auto';

    // That's it! No scroll logic, no interference, just let the container grow
    // User has complete scroll freedom during streaming
  }

  /**
   * OPTIONAL: Gentle scroll to bottom only when streaming completes
   */
  private static optionalScrollToBottomOnComplete(): void {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    const scrollTop = messagesContainer.scrollTop;
    const scrollHeight = messagesContainer.scrollHeight;
    const clientHeight = messagesContainer.clientHeight;

    // Only scroll if user was already near the bottom (within 200px)
    // This suggests they were following along
    const wasNearBottom = (scrollTop + clientHeight) >= (scrollHeight - 200);

    if (wasNearBottom && !this.userHasScrolled) {
      // Gentle scroll to show the complete response
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      console.log('📜 Gentle scroll to bottom - streaming complete');
    } else {
      console.log('🛑 User was reading elsewhere - no scroll interference');
    }
  }

  /**
   * Setup scroll listener to detect user scroll intent
   */
  private static setupScrollListener(): void {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer && !messagesContainer.hasAttribute('data-scroll-listener')) {
      messagesContainer.setAttribute('data-scroll-listener', 'true');

      messagesContainer.addEventListener('scroll', () => {
        this.userHasScrolled = true;
        this.lastScrollTime = Date.now();
      });
    }
  }

  /**
   * Ensure streaming content is visible and container expands properly
   * NEVER hold the page hostage - respect user scroll freedom
   */
  private static ensureContentVisible(messageEl: HTMLElement, textEl: HTMLElement): void {
    // Force height recalculation
    messageEl.style.height = 'auto';

    // Ensure the text container expands
    textEl.style.height = 'auto';

    // Setup scroll listener if not already done
    this.setupScrollListener();

    // MINIMAL auto-scroll: only if user is actively following at the very bottom
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
      const scrollTop = messagesContainer.scrollTop;
      const scrollHeight = messagesContainer.scrollHeight;
      const clientHeight = messagesContainer.clientHeight;

      // Much longer grace period - if user scrolled in last 5 seconds, leave them alone
      const recentlyScrolled = this.userHasScrolled && (Date.now() - this.lastScrollTime) < 5000;

      // Very strict bottom detection - only auto-scroll if user is RIGHT at the bottom
      const isRightAtBottom = (scrollTop + clientHeight) >= (scrollHeight - 5);

      // RESPECT USER FREEDOM: No auto-scroll if disabled or user has scrolled
      if (!this.autoScrollDisabled && isRightAtBottom && !recentlyScrolled) {
        // User is actively following along - gentle scroll to show new content
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.hideScrollIndicator();
      } else {
        // User has scrolled up or wants to read - RESPECT THEIR FREEDOM
        // Show indicator but DON'T force scroll
        this.showScrollIndicator();

        // If user scrolled up significantly, disable auto-scroll for this session
        if (recentlyScrolled && (scrollHeight - scrollTop - clientHeight) > 100) {
          this.autoScrollDisabled = true;
          console.log('🛑 Auto-scroll disabled - user wants to read freely');
        }
      }
    }
  }

  /**
   * Show scroll indicator when user scrolls up during streaming
   */
  private static showScrollIndicator(): void {
    let indicator = document.getElementById('streamScrollIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'streamScrollIndicator';
      indicator.className = 'scroll-indicator';
      indicator.innerHTML = 'New content below';
      indicator.onclick = () => this.scrollToBottom();
      document.body.appendChild(indicator);
    }
    indicator.classList.add('visible');
  }

  /**
   * Hide scroll indicator
   */
  private static hideScrollIndicator(): void {
    const indicator = document.getElementById('streamScrollIndicator');
    if (indicator) {
      indicator.classList.remove('visible');
    }
  }

  /**
   * Scroll to bottom and hide indicator
   */
  private static scrollToBottom(): void {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    this.hideScrollIndicator();
  }

  /**
   * Set global streaming speed for all new streams
   */
  static setStreamingSpeed(speed: 'slow' | 'medium' | 'fast' | 'instant'): void {
    this.globalSpeed = speed;

    // Update existing active buffers
    this.activeBuffers.forEach(buffer => {
      buffer.setSpeed(speed);
    });

    console.log(`🌊 Streaming speed set to: ${speed}`);
  }

  /**
   * Get current streaming speed
   */
  static getStreamingSpeed(): string {
    return this.globalSpeed;
  }

  /**
   * Get available streaming speeds with descriptions
   */
  static getAvailableSpeeds(): Array<{value: string, label: string, description: string}> {
    return [
      { value: 'slow', label: 'Slow', description: 'Very readable, like careful typing (120ms)' },
      { value: 'medium', label: 'Medium', description: 'Natural typing speed (60ms)' },
      { value: 'fast', label: 'Fast', description: 'Quick but smooth (30ms)' },
      { value: 'instant', label: 'Instant', description: 'No delay, current behavior' }
    ];
  }
}
