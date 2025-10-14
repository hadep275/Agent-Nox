const vscode = require("vscode");
const fs = require("fs").promises;
const path = require("path");

/**
 * 🦊 Enterprise Context Manager for intelligent code context retrieval
 * Provides intelligent code snippet retrieval and workspace analysis
 */
class ContextManager {
  constructor(context, logger, performanceMonitor, cacheManager) {
    this.context = context;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.cacheManager = cacheManager;
    this.isInitialized = false;

    // Context storage
    this.fileIndex = new Map(); // filePath -> { content, symbols, lastModified }
    this.symbolIndex = new Map(); // symbol -> [{ file, line, type }]
    this.workspacePath = null;

    // Configuration
    this.maxFileSize = 1024 * 1024; // 1MB max file size
    this.supportedExtensions = new Set([
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".py",
      ".java",
      ".c",
      ".cpp",
      ".cs",
      ".go",
      ".rs",
      ".php",
      ".rb",
      ".swift",
      ".kt",
      ".scala",
      ".clj",
      ".html",
      ".css",
      ".scss",
      ".less",
      ".vue",
      ".svelte",
      ".json",
      ".xml",
      ".yaml",
      ".yml",
      ".toml",
      ".ini",
      ".cfg",
      ".conf",
    ]);

    // Exclude patterns
    this.excludePatterns = [
      "node_modules",
      ".git",
      ".vscode",
      "dist",
      "build",
      "target",
      ".next",
      ".nuxt",
      "coverage",
      ".nyc_output",
      "logs",
      "tmp",
      "*.min.js",
      "*.bundle.js",
      "*.map",
    ];
  }

  /**
   * Initialize context manager
   */
  async initialize() {
    try {
      this.logger.info("🦊 Initializing Context Manager...");

      // Get workspace path
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        this.workspacePath = workspaceFolders[0].uri.fsPath;
        this.logger.info(`📁 Workspace detected: ${this.workspacePath}`);
      } else {
        this.logger.warn("⚠️ No workspace folder detected");
        this.isInitialized = true;
        return;
      }

      // Start initial indexing (async)
      this.startInitialIndexing();

      this.isInitialized = true;
      this.logger.info("🦊 Context Manager initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize Context Manager:", error);
      throw error;
    }
  }

  /**
   * 🔍 Start initial workspace indexing (async)
   */
  async startInitialIndexing() {
    try {
      const timer = this.performanceMonitor.startTimer("initial_indexing");
      this.logger.info("🔍 Starting initial workspace indexing...");

      await this.scanWorkspace();

      timer.end();
      this.logger.info(`🔍 Initial indexing completed in ${timer.duration}ms`);
      this.performanceMonitor.recordMetric(
        "files_indexed",
        this.fileIndex.size
      );
    } catch (error) {
      this.logger.error("Initial indexing failed:", error);
    }
  }

  /**
   * 📁 Scan workspace for files
   */
  async scanWorkspace() {
    if (!this.workspacePath) return;

    try {
      await this.scanDirectory(this.workspacePath);
    } catch (error) {
      this.logger.error("Workspace scanning failed:", error);
    }
  }

  /**
   * 📂 Recursively scan directory
   */
  async scanDirectory(dirPath, depth = 0) {
    if (depth > 10) return; // Prevent infinite recursion

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip excluded patterns
        if (this.shouldExclude(entry.name, fullPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, depth + 1);
        } else if (entry.isFile()) {
          await this.indexFile(fullPath);
        }
      }
    } catch (error) {
      this.logger.debug(`Failed to scan directory ${dirPath}:`, error);
    }
  }

  /**
   * 📄 Index a single file
   */
  async indexFile(filePath) {
    try {
      // Check if file should be indexed
      if (!this.shouldIndexFile(filePath)) {
        return;
      }

      const stats = await fs.stat(filePath);

      // Skip large files
      if (stats.size > this.maxFileSize) {
        this.logger.debug(
          `Skipping large file: ${filePath} (${stats.size} bytes)`
        );
        return;
      }

      // Check if file is already indexed and up-to-date
      const existing = this.fileIndex.get(filePath);
      if (existing && existing.lastModified >= stats.mtime.getTime()) {
        return;
      }

      // Read and index file content
      const content = await fs.readFile(filePath, "utf8");
      const symbols = this.extractSymbols(content, filePath);

      const fileData = {
        content,
        symbols,
        lastModified: stats.mtime.getTime(),
        size: stats.size,
        extension: path.extname(filePath),
      };

      this.fileIndex.set(filePath, fileData);

      // Update symbol index
      this.updateSymbolIndex(filePath, symbols);

      this.logger.debug(
        `📄 Indexed file: ${path.relative(this.workspacePath, filePath)}`
      );
    } catch (error) {
      this.logger.debug(`Failed to index file ${filePath}:`, error);
    }
  }

  /**
   * 🔍 Extract symbols from file content
   */
  extractSymbols(content, filePath) {
    const symbols = [];
    const lines = content.split("\n");
    const extension = path.extname(filePath);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Extract different types of symbols based on file type
      if ([".js", ".ts", ".jsx", ".tsx"].includes(extension)) {
        symbols.push(...this.extractJavaScriptSymbols(line, lineNumber));
      } else if ([".py"].includes(extension)) {
        symbols.push(...this.extractPythonSymbols(line, lineNumber));
      } else if ([".java", ".cs"].includes(extension)) {
        symbols.push(...this.extractJavaSymbols(line, lineNumber));
      }

      // Generic patterns for all languages
      symbols.push(...this.extractGenericSymbols(line, lineNumber));
    }

    return symbols;
  }

  /**
   * 🔍 Extract JavaScript/TypeScript symbols
   */
  extractJavaScriptSymbols(line, lineNumber) {
    const symbols = [];

    // Functions
    const functionMatch = line.match(
      /(?:function\s+|const\s+|let\s+|var\s+)(\w+)\s*[=\(]/
    );
    if (functionMatch) {
      symbols.push({
        name: functionMatch[1],
        type: "function",
        line: lineNumber,
      });
    }

    // Classes
    const classMatch = line.match(/class\s+(\w+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[1], type: "class", line: lineNumber });
    }

    // Methods
    const methodMatch = line.match(/(\w+)\s*\([^)]*\)\s*{/);
    if (methodMatch && !line.includes("function") && !line.includes("=")) {
      symbols.push({ name: methodMatch[1], type: "method", line: lineNumber });
    }

    // Imports/Exports
    const importMatch = line.match(/import\s+.*from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      symbols.push({ name: importMatch[1], type: "import", line: lineNumber });
    }

    return symbols;
  }

  /**
   * 🔍 Extract Python symbols
   */
  extractPythonSymbols(line, lineNumber) {
    const symbols = [];

    // Functions
    const functionMatch = line.match(/def\s+(\w+)\s*\(/);
    if (functionMatch) {
      symbols.push({
        name: functionMatch[1],
        type: "function",
        line: lineNumber,
      });
    }

    // Classes
    const classMatch = line.match(/class\s+(\w+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[1], type: "class", line: lineNumber });
    }

    // Imports
    const importMatch = line.match(/(?:from\s+(\w+)\s+)?import\s+(\w+)/);
    if (importMatch) {
      symbols.push({
        name: importMatch[2] || importMatch[1],
        type: "import",
        line: lineNumber,
      });
    }

    return symbols;
  }

  /**
   * 🔍 Extract Java/C# symbols
   */
  extractJavaSymbols(line, lineNumber) {
    const symbols = [];

    // Methods
    const methodMatch = line.match(
      /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/
    );
    if (methodMatch) {
      symbols.push({ name: methodMatch[1], type: "method", line: lineNumber });
    }

    // Classes
    const classMatch = line.match(/(?:public|private)?\s*class\s+(\w+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[1], type: "class", line: lineNumber });
    }

    return symbols;
  }

  /**
   * 🔍 Extract generic symbols (comments, TODOs, etc.)
   */
  extractGenericSymbols(line, lineNumber) {
    const symbols = [];

    // TODO comments
    const todoMatch = line.match(
      /(?:\/\/|#|\/\*)\s*(TODO|FIXME|HACK|NOTE):\s*(.+)/i
    );
    if (todoMatch) {
      symbols.push({
        name: `${todoMatch[1]}: ${todoMatch[2].trim()}`,
        type: "todo",
        line: lineNumber,
      });
    }

    return symbols;
  }

  /**
   * 🔄 Update symbol index
   */
  updateSymbolIndex(filePath, symbols) {
    // Remove old symbols for this file
    for (const [symbolName, locations] of this.symbolIndex.entries()) {
      const filtered = locations.filter((loc) => loc.file !== filePath);
      if (filtered.length === 0) {
        this.symbolIndex.delete(symbolName);
      } else {
        this.symbolIndex.set(symbolName, filtered);
      }
    }

    // Add new symbols
    for (const symbol of symbols) {
      const existing = this.symbolIndex.get(symbol.name) || [];
      existing.push({
        file: filePath,
        line: symbol.line,
        type: symbol.type,
      });
      this.symbolIndex.set(symbol.name, existing);
    }
  }

  /**
   * ❓ Should exclude file/directory
   */
  shouldExclude(name, fullPath) {
    // Check exclude patterns
    for (const pattern of this.excludePatterns) {
      if (pattern.includes("*")) {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        if (regex.test(name)) return true;
      } else if (name === pattern || fullPath.includes(pattern)) {
        return true;
      }
    }

    // Skip hidden files/directories
    if (name.startsWith(".") && name !== ".env") {
      return true;
    }

    return false;
  }

  /**
   * ❓ Should index file
   */
  shouldIndexFile(filePath) {
    const extension = path.extname(filePath);
    return this.supportedExtensions.has(extension);
  }

  /**
   * 🔍 Get relevant context for a query
   */
  async getContext(query, options = {}) {
    if (!this.isInitialized) {
      throw new Error("Context Manager not initialized");
    }

    const timer = this.performanceMonitor.startTimer("context_retrieval");

    try {
      const maxFiles = options.maxFiles || 10;
      const maxLines = options.maxLines || 100;

      // Search for relevant files and symbols
      const relevantFiles = this.searchFiles(query, maxFiles);
      const relevantSymbols = this.searchSymbols(query);

      // Get file contents with context
      const contextFiles = [];
      for (const fileMatch of relevantFiles) {
        const fileData = this.fileIndex.get(fileMatch.path);
        if (fileData) {
          contextFiles.push({
            path: path.relative(this.workspacePath, fileMatch.path),
            content: this.getRelevantLines(fileData.content, query, maxLines),
            relevanceScore: fileMatch.score,
            symbols: fileData.symbols.filter((s) =>
              s.name.toLowerCase().includes(query.toLowerCase())
            ),
          });
        }
      }

      timer.end();

      const result = {
        files: contextFiles,
        symbols: relevantSymbols,
        relevanceScore: this.calculateOverallRelevance(
          contextFiles,
          relevantSymbols
        ),
        query,
        totalFiles: this.fileIndex.size,
        searchTime: timer.duration,
      };

      this.logger.info(
        `🔍 Context retrieved: ${contextFiles.length} files, ${relevantSymbols.length} symbols`
      );
      return result;
    } catch (error) {
      timer.end();
      this.logger.error("Context retrieval failed:", error);
      throw error;
    }
  }

  /**
   * 🔍 Search files by content and name
   */
  searchFiles(query, maxFiles) {
    const results = [];
    const queryLower = query.toLowerCase();

    for (const [filePath, fileData] of this.fileIndex.entries()) {
      let score = 0;

      // File name relevance
      const fileName = path.basename(filePath).toLowerCase();
      if (fileName.includes(queryLower)) {
        score += 10;
      }

      // Content relevance
      const contentLower = fileData.content.toLowerCase();
      const matches = (contentLower.match(new RegExp(queryLower, "g")) || [])
        .length;
      score += matches;

      // Symbol relevance
      const symbolMatches = fileData.symbols.filter((s) =>
        s.name.toLowerCase().includes(queryLower)
      ).length;
      score += symbolMatches * 5;

      if (score > 0) {
        results.push({ path: filePath, score });
      }
    }

    // Sort by relevance and limit results
    return results.sort((a, b) => b.score - a.score).slice(0, maxFiles);
  }

  /**
   * 🔍 Search symbols
   */
  searchSymbols(query) {
    const results = [];
    const queryLower = query.toLowerCase();

    for (const [symbolName, locations] of this.symbolIndex.entries()) {
      if (symbolName.toLowerCase().includes(queryLower)) {
        for (const location of locations) {
          results.push({
            name: symbolName,
            file: path.relative(this.workspacePath, location.file),
            line: location.line,
            type: location.type,
          });
        }
      }
    }

    return results.slice(0, 20); // Limit symbol results
  }

  /**
   * 📄 Get relevant lines from file content
   */
  getRelevantLines(content, query, maxLines) {
    const lines = content.split("\n");
    const queryLower = query.toLowerCase();
    const relevantLines = [];

    // Find lines containing the query
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(queryLower)) {
        // Include context around matching lines
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length, i + 3);

        for (let j = start; j < end; j++) {
          if (!relevantLines.some((rl) => rl.number === j + 1)) {
            relevantLines.push({
              number: j + 1,
              content: lines[j],
              isMatch: j === i,
            });
          }
        }
      }
    }

    // If no matches, return first few lines
    if (relevantLines.length === 0) {
      for (let i = 0; i < Math.min(maxLines / 2, lines.length); i++) {
        relevantLines.push({
          number: i + 1,
          content: lines[i],
          isMatch: false,
        });
      }
    }

    // Sort by line number and limit
    return relevantLines.sort((a, b) => a.number - b.number).slice(0, maxLines);
  }

  /**
   * 📊 Calculate overall relevance score
   */
  calculateOverallRelevance(files, symbols) {
    if (files.length === 0 && symbols.length === 0) return 0;

    const fileScore =
      files.reduce((sum, f) => sum + f.relevanceScore, 0) / files.length;
    const symbolScore = symbols.length > 0 ? 0.8 : 0;

    return Math.min(1, (fileScore + symbolScore) / 10);
  }

  /**
   * 🔄 Update file index when file changes
   */
  async updateFileIndex(filePath, content) {
    try {
      if (!this.shouldIndexFile(filePath)) return;

      const symbols = this.extractSymbols(content, filePath);
      const fileData = {
        content,
        symbols,
        lastModified: Date.now(),
        size: content.length,
        extension: path.extname(filePath),
      };

      this.fileIndex.set(filePath, fileData);
      this.updateSymbolIndex(filePath, symbols);

      this.logger.debug(
        `🔄 Updated file index: ${path.relative(this.workspacePath, filePath)}`
      );
    } catch (error) {
      this.logger.error(`Failed to update file index for ${filePath}:`, error);
    }
  }

  /**
   * 📊 Get context statistics
   */
  getStats() {
    return {
      totalFiles: this.fileIndex.size,
      totalSymbols: this.symbolIndex.size,
      supportedExtensions: Array.from(this.supportedExtensions),
      workspacePath: this.workspacePath,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      this.logger.info("Cleaning up Context Manager...");
      this.fileIndex.clear();
      this.symbolIndex.clear();
      this.isInitialized = false;
    } catch (error) {
      this.logger.error("Error during Context Manager cleanup:", error);
    }
  }
}

module.exports = ContextManager;
