/**
 * 🦊 Nox Markdown Test Module
 * Test enterprise markdown libraries integration
 */

import { marked } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

/**
 * Test markdown rendering functionality
 */
export class MarkdownTester {
  
  /**
   * Test basic markdown parsing
   */
  static testBasicMarkdown(): boolean {
    try {
      const testMarkdown = `
# Test Header
This is **bold** and *italic* text.

\`\`\`javascript
console.log('Hello, Nox!');
\`\`\`

- List item 1
- List item 2
      `;
      
      const html = marked(testMarkdown);
      console.log('✅ Marked.js basic test passed');
      console.log('Generated HTML:', html);
      return true;
    } catch (error) {
      console.error('❌ Marked.js test failed:', error);
      return false;
    }
  }
  
  /**
   * Test syntax highlighting
   */
  static testSyntaxHighlighting(): boolean {
    try {
      const code = `
function greetNox() {
  console.log('Hello from Nox! 🦊');
  return 'Enterprise-grade AI coding';
}
      `;
      
      const highlighted = hljs.highlight(code, { language: 'javascript' });
      console.log('✅ Highlight.js test passed');
      console.log('Highlighted code:', highlighted.value);
      return true;
    } catch (error) {
      console.error('❌ Highlight.js test failed:', error);
      return false;
    }
  }
  
  /**
   * Test XSS protection
   */
  static testXSSProtection(): boolean {
    try {
      const maliciousHTML = `
        <script>alert('XSS Attack!');</script>
        <img src="x" onerror="alert('XSS!')">
        <p>Safe content</p>
      `;
      
      const sanitized = DOMPurify.sanitize(maliciousHTML);
      console.log('✅ DOMPurify test passed');
      console.log('Sanitized HTML:', sanitized);
      
      // Should not contain script tags
      const hasScript = sanitized.includes('<script>');
      const hasOnerror = sanitized.includes('onerror');
      
      if (hasScript || hasOnerror) {
        console.error('❌ DOMPurify failed to sanitize malicious content');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ DOMPurify test failed:', error);
      return false;
    }
  }
  
  /**
   * Run all tests
   */
  static runAllTests(): boolean {
    console.log('🦊 Running Nox Markdown Library Tests...');
    
    const results = [
      this.testBasicMarkdown(),
      this.testSyntaxHighlighting(),
      this.testXSSProtection()
    ];
    
    const allPassed = results.every(result => result);
    
    if (allPassed) {
      console.log('🎉 All markdown library tests passed!');
    } else {
      console.error('❌ Some markdown library tests failed');
    }
    
    return allPassed;
  }
}
