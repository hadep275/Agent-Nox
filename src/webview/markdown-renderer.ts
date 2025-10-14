/**
 * 🦊 Nox Enterprise Markdown Renderer
 * Aurora-themed markdown rendering with syntax highlighting
 */

import { marked, Renderer } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

/**
 * Enterprise Markdown Renderer with Aurora theming
 */
export class NoxMarkdownRenderer {
  private static instance: NoxMarkdownRenderer;
  private renderer: Renderer;
  
  private constructor() {
    this.renderer = new Renderer();
    this.setupCustomRenderers();
    this.configureMarked();
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): NoxMarkdownRenderer {
    if (!NoxMarkdownRenderer.instance) {
      NoxMarkdownRenderer.instance = new NoxMarkdownRenderer();
    }
    return NoxMarkdownRenderer.instance;
  }
  
  /**
   * Setup custom Aurora-themed renderers
   */
  private setupCustomRenderers(): void {
    // Custom heading renderer with Aurora colors
    this.renderer.heading = (text: string, level: number): string => {
      const colors = {
        1: 'var(--aurora-blue)',
        2: 'var(--aurora-purple)', 
        3: 'var(--aurora-cyan)',
        4: 'var(--aurora-green)',
        5: 'var(--aurora-pink)',
        6: 'var(--aurora-orange)'
      };
      
      const color = colors[level as keyof typeof colors] || 'var(--aurora-blue)';
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');
      
      return `
        <h${level} id="${id}" class="nox-heading nox-h${level}" style="color: ${color};">
          ${text}
        </h${level}>
      `;
    };
    
    // Custom code block renderer with syntax highlighting
    this.renderer.code = (code: string, language: string | undefined): string => {
      const validLanguage = language && hljs.getLanguage(language) ? language : 'plaintext';
      const highlighted = hljs.highlight(code, { language: validLanguage });
      
      return `
        <div class="nox-code-block" data-language="${validLanguage}">
          <div class="nox-code-header">
            <span class="nox-code-language">${this.getLanguageDisplayName(validLanguage)}</span>
            <button class="nox-copy-btn" onclick="copyCodeToClipboard(this)" title="Copy code">
              <span class="copy-icon">📋</span>
            </button>
          </div>
          <pre class="nox-code-content"><code class="hljs language-${validLanguage}">${highlighted.value}</code></pre>
        </div>
      `;
    };
    
    // Custom inline code renderer
    this.renderer.codespan = (code: string): string => {
      return `<code class="nox-inline-code">${code}</code>`;
    };
    
    // Custom list renderer with Aurora styling
    this.renderer.list = (body: string, ordered: boolean): string => {
      const tag = ordered ? 'ol' : 'ul';
      const className = ordered ? 'nox-ordered-list' : 'nox-unordered-list';
      return `<${tag} class="${className}">${body}</${tag}>`;
    };
    
    // Custom list item renderer
    this.renderer.listitem = (text: string): string => {
      return `<li class="nox-list-item">${text}</li>`;
    };
    
    // Custom blockquote renderer
    this.renderer.blockquote = (quote: string): string => {
      return `<blockquote class="nox-blockquote">${quote}</blockquote>`;
    };
    
    // Custom table renderer
    this.renderer.table = (header: string, body: string): string => {
      return `
        <div class="nox-table-container">
          <table class="nox-table">
            <thead class="nox-table-header">${header}</thead>
            <tbody class="nox-table-body">${body}</tbody>
          </table>
        </div>
      `;
    };
    
    // Custom link renderer with security
    this.renderer.link = (href: string, title: string | null, text: string): string => {
      const safeHref = DOMPurify.sanitize(href);
      const safeTitle = title ? DOMPurify.sanitize(title) : '';
      const titleAttr = safeTitle ? ` title="${safeTitle}"` : '';
      
      return `<a href="${safeHref}" class="nox-link" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    };
    
    // Custom paragraph renderer
    this.renderer.paragraph = (text: string): string => {
      return `<p class="nox-paragraph">${text}</p>`;
    };
    
    // Custom strong/bold renderer
    this.renderer.strong = (text: string): string => {
      return `<strong class="nox-strong">${text}</strong>`;
    };
    
    // Custom emphasis/italic renderer
    this.renderer.em = (text: string): string => {
      return `<em class="nox-emphasis">${text}</em>`;
    };
  }
  
  /**
   * Configure marked with our custom renderer
   */
  private configureMarked(): void {
    marked.setOptions({
      renderer: this.renderer,
      gfm: true,
      breaks: true
    });
  }
  
  /**
   * Render markdown to HTML with Aurora theming
   */
  render(markdown: string): string {
    try {
      // First pass: marked.js processing
      const html = marked(markdown);
      
      // Second pass: DOMPurify sanitization
      const sanitized = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'strong', 'em', 'code', 'pre',
          'ul', 'ol', 'li', 'blockquote',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'a', 'div', 'span', 'button'
        ],
        ALLOWED_ATTR: [
          'class', 'id', 'style', 'data-language',
          'href', 'target', 'rel', 'title', 'onclick'
        ],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
      });
      
      return sanitized;
    } catch (error) {
      console.error('🦊 Markdown rendering error:', error);
      // Fallback to escaped plain text
      return `<p class="nox-error">Error rendering markdown: ${this.escapeHtml(markdown)}</p>`;
    }
  }
  
  /**
   * Get display name for programming language
   */
  private getLanguageDisplayName(lang: string): string {
    const languageNames: Record<string, string> = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'java': 'Java',
      'csharp': 'C#',
      'cpp': 'C++',
      'c': 'C',
      'rust': 'Rust',
      'go': 'Go',
      'php': 'PHP',
      'ruby': 'Ruby',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'scala': 'Scala',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'json': 'JSON',
      'xml': 'XML',
      'yaml': 'YAML',
      'markdown': 'Markdown',
      'bash': 'Bash',
      'shell': 'Shell',
      'powershell': 'PowerShell',
      'sql': 'SQL',
      'dockerfile': 'Dockerfile',
      'plaintext': 'Text'
    };
    
    return languageNames[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  }
  
  /**
   * Escape HTML for fallback rendering
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Global function for copy button functionality
 */
declare global {
  interface Window {
    copyCodeToClipboard: (button: HTMLButtonElement) => void;
  }
}

// Add global copy function
window.copyCodeToClipboard = (button: HTMLButtonElement) => {
  const codeBlock = button.closest('.nox-code-block');
  const codeContent = codeBlock?.querySelector('code');
  
  if (codeContent) {
    const code = codeContent.textContent || '';
    navigator.clipboard.writeText(code).then(() => {
      const icon = button.querySelector('.copy-icon');
      if (icon) {
        const originalText = icon.textContent;
        icon.textContent = '✅';
        setTimeout(() => {
          icon.textContent = originalText;
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy code:', err);
    });
  }
};
