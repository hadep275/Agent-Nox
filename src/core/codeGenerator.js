const vscode = require("vscode");
const path = require("path");
const {
  getReactComponentTemplate,
  getVueComponentTemplate,
  getJavaScriptFunctionTemplate,
  getTypeScriptFunctionTemplate,
  getJavaScriptClassTemplate,
  getTypeScriptClassTemplate,
  getExpressAPITemplate,
} = require("./codeTemplates");

/**
 * 🦊 NOX Intelligent Code Generator
 * Enterprise-grade code generation with templates, patterns, and AI-driven creation
 */
class NoxCodeGenerator {
  constructor(logger, performanceMonitor, contextManager) {
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.contextManager = contextManager;
    this.isInitialized = true;

    // Code generation templates and patterns
    this.templates = this.initializeTemplates();
    this.patterns = this.initializePatterns();
    this.frameworks = this.initializeFrameworks();

    this.logger.debug("🚀 NOX Code Generator initialized");
  }

  /**
   * 🎨 Generate intelligent code based on requirements
   */
  async generateCode(requirements, context = {}) {
    const timer = this.performanceMonitor.startTimer("code_generation");

    try {
      this.logger.info(`🎨 Generating code for: ${requirements.type}`);

      // Analyze requirements and determine generation strategy
      const strategy = await this.analyzeRequirements(requirements, context);

      // Generate code based on strategy
      let generatedCode;
      switch (strategy.type) {
        case "component":
          generatedCode = await this.generateComponent(
            requirements,
            strategy,
            context
          );
          break;
        case "function":
          generatedCode = await this.generateFunction(
            requirements,
            strategy,
            context
          );
          break;
        case "class":
          generatedCode = await this.generateClass(
            requirements,
            strategy,
            context
          );
          break;
        case "api":
          generatedCode = await this.generateAPI(
            requirements,
            strategy,
            context
          );
          break;
        case "test":
          generatedCode = await this.generateTest(
            requirements,
            strategy,
            context
          );
          break;
        case "config":
          generatedCode = await this.generateConfig(
            requirements,
            strategy,
            context
          );
          break;
        case "project":
          generatedCode = await this.generateProject(
            requirements,
            strategy,
            context
          );
          break;
        default:
          generatedCode = await this.generateGeneric(
            requirements,
            strategy,
            context
          );
      }

      timer.end();

      return {
        success: true,
        code: generatedCode.code,
        files: generatedCode.files || [],
        metadata: {
          strategy: strategy.type,
          framework: strategy.framework,
          language: strategy.language,
          generationTime: timer.duration,
          patterns: strategy.patterns,
          dependencies: generatedCode.dependencies || [],
        },
      };
    } catch (error) {
      timer.end();
      this.logger.error("Code generation failed:", error);
      throw error;
    }
  }

  /**
   * 🧠 Analyze requirements to determine generation strategy
   */
  async analyzeRequirements(requirements, context) {
    // Detect project type and framework from context
    const projectInfo = await this.detectProjectInfo(context);

    // Analyze requirement text for patterns
    const patterns = this.detectPatterns(
      requirements.description || requirements.type
    );

    // Determine language and framework
    const language =
      requirements.language || projectInfo.language || "javascript";
    const framework =
      requirements.framework || projectInfo.framework || "vanilla";

    return {
      type: this.determineGenerationType(requirements, patterns),
      language,
      framework,
      patterns,
      projectInfo,
      complexity: this.assessComplexity(requirements, patterns),
    };
  }

  /**
   * 🔍 Detect project information from context
   */
  async detectProjectInfo(context) {
    const info = {
      language: "javascript",
      framework: "vanilla",
      packageManager: "npm",
      testFramework: "jest",
      buildTool: "webpack",
    };

    // Check package.json for framework detection
    if (context.projectStructure) {
      const packageJson = context.projectStructure.find(
        (f) => f.name === "package.json"
      );
      if (packageJson) {
        // Parse package.json to detect frameworks
        try {
          const content = await this.contextManager.getFileContent(
            packageJson.path
          );

          // Check if content is empty or invalid
          if (!content || content.trim() === "") {
            this.logger.warn(
              "package.json is empty, skipping framework detection"
            );
            return info;
          }

          const pkg = JSON.parse(content);

          // Detect React
          if (pkg.dependencies?.react || pkg.devDependencies?.react) {
            info.framework = "react";
            info.language = pkg.dependencies?.typescript
              ? "typescript"
              : "javascript";
          }

          // Detect Vue
          if (pkg.dependencies?.vue || pkg.devDependencies?.vue) {
            info.framework = "vue";
          }

          // Detect Angular
          if (pkg.dependencies?.["@angular/core"]) {
            info.framework = "angular";
            info.language = "typescript";
          }

          // Detect Next.js
          if (pkg.dependencies?.next) {
            info.framework = "nextjs";
          }

          // Detect package manager
          if (context.projectStructure.find((f) => f.name === "yarn.lock")) {
            info.packageManager = "yarn";
          } else if (
            context.projectStructure.find((f) => f.name === "pnpm-lock.yaml")
          ) {
            info.packageManager = "pnpm";
          }
        } catch (error) {
          this.logger.warn(
            `Failed to parse package.json at ${packageJson.path}: ${error.message}`
          );
          // Return info with defaults if parsing fails
          return info;
        }
      }
    }

    return info;
  }

  /**
   * 🎯 Determine generation type from requirements
   */
  determineGenerationType(requirements, patterns) {
    const type = requirements.type?.toLowerCase() || "";
    const description = requirements.description?.toLowerCase() || "";

    // Component patterns
    if (patterns.includes("component") || type.includes("component")) {
      return "component";
    }

    // Function patterns
    if (
      patterns.includes("function") ||
      type.includes("function") ||
      type.includes("util")
    ) {
      return "function";
    }

    // Class patterns
    if (
      patterns.includes("class") ||
      type.includes("class") ||
      type.includes("service")
    ) {
      return "class";
    }

    // API patterns
    if (
      patterns.includes("api") ||
      patterns.includes("endpoint") ||
      type.includes("api")
    ) {
      return "api";
    }

    // Test patterns
    if (
      patterns.includes("test") ||
      type.includes("test") ||
      type.includes("spec")
    ) {
      return "test";
    }

    // Config patterns
    if (
      patterns.includes("config") ||
      type.includes("config") ||
      type.includes("setup")
    ) {
      return "config";
    }

    // Project patterns
    if (
      patterns.includes("project") ||
      type.includes("project") ||
      type.includes("scaffold")
    ) {
      return "project";
    }

    return "generic";
  }

  /**
   * 🔍 Detect patterns in requirement text
   */
  detectPatterns(text) {
    const patterns = [];
    const lowerText = text.toLowerCase();

    const patternMap = {
      component: ["component", "widget", "ui", "interface"],
      function: ["function", "utility", "helper", "util"],
      class: ["class", "service", "model", "entity"],
      api: ["api", "endpoint", "route", "controller"],
      test: ["test", "spec", "testing", "unit test"],
      config: ["config", "configuration", "setup", "environment"],
      project: ["project", "scaffold", "boilerplate", "template"],
      crud: ["crud", "create", "read", "update", "delete"],
      auth: ["auth", "authentication", "login", "signup"],
      database: ["database", "db", "model", "schema"],
      form: ["form", "input", "validation", "submit"],
    };

    for (const [pattern, keywords] of Object.entries(patternMap)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * 📊 Assess complexity of requirements
   */
  assessComplexity(requirements, patterns) {
    let complexity = "simple";

    // Check for multiple patterns
    if (patterns.length > 2) {
      complexity = "complex";
    } else if (patterns.length > 1) {
      complexity = "medium";
    }

    // Check for specific complex patterns
    if (
      patterns.includes("crud") ||
      patterns.includes("auth") ||
      patterns.includes("database")
    ) {
      complexity = "complex";
    }

    // Check description length and detail
    const description = requirements.description || "";
    if (description.length > 500) {
      complexity = complexity === "simple" ? "medium" : "complex";
    }

    return complexity;
  }

  /**
   * 🎨 Initialize code templates
   */
  initializeTemplates() {
    return {
      react: {
        component: this.getReactComponentTemplate(),
        hook: this.getReactHookTemplate(),
        context: this.getReactContextTemplate(),
      },
      vue: {
        component: this.getVueComponentTemplate(),
        composable: this.getVueComposableTemplate(),
      },
      node: {
        express: this.getExpressTemplate(),
        middleware: this.getMiddlewareTemplate(),
        controller: this.getControllerTemplate(),
      },
      python: {
        class: this.getPythonClassTemplate(),
        function: this.getPythonFunctionTemplate(),
        fastapi: this.getFastAPITemplate(),
      },
      typescript: {
        interface: this.getTypeScriptInterfaceTemplate(),
        type: this.getTypeScriptTypeTemplate(),
        class: this.getTypeScriptClassTemplate(),
      },
    };
  }

  /**
   * 🎯 Initialize code patterns
   */
  initializePatterns() {
    return {
      crud: this.getCRUDPattern(),
      auth: this.getAuthPattern(),
      validation: this.getValidationPattern(),
      testing: this.getTestingPattern(),
      errorHandling: this.getErrorHandlingPattern(),
    };
  }

  /**
   * 🏗️ Initialize framework configurations
   */
  initializeFrameworks() {
    return {
      react: {
        dependencies: ["react", "react-dom"],
        devDependencies: ["@types/react", "@types/react-dom"],
        fileExtensions: [".jsx", ".tsx"],
        testFramework: "jest",
      },
      vue: {
        dependencies: ["vue"],
        devDependencies: ["@vue/cli-service"],
        fileExtensions: [".vue"],
        testFramework: "vitest",
      },
      angular: {
        dependencies: ["@angular/core", "@angular/common"],
        devDependencies: ["@angular/cli"],
        fileExtensions: [".ts", ".html", ".scss"],
        testFramework: "jasmine",
      },
      nextjs: {
        dependencies: ["next", "react", "react-dom"],
        devDependencies: ["@types/react"],
        fileExtensions: [".js", ".jsx", ".ts", ".tsx"],
        testFramework: "jest",
      },
    };
  }

  /**
   * 🎨 Generate React Component
   */
  async generateComponent(requirements, strategy, context) {
    const { language, framework } = strategy;
    const componentName = requirements.name || "NewComponent";

    let template;
    let fileExtension;

    if (framework === "react") {
      template = this.getReactComponentTemplate();
      fileExtension = language === "typescript" ? ".tsx" : ".jsx";
    } else if (framework === "vue") {
      template = this.getVueComponentTemplate();
      fileExtension = ".vue";
    } else {
      template = this.getGenericComponentTemplate();
      fileExtension = ".js";
    }

    const code = this.processTemplate(template, {
      componentName,
      props: requirements.props || [],
      state: requirements.state || [],
      methods: requirements.methods || [],
      styling: requirements.styling || "css",
      typescript: language === "typescript",
    });

    return {
      code,
      files: [
        {
          name: `${componentName}${fileExtension}`,
          content: code,
          type: "component",
        },
      ],
      dependencies: this.getFrameworkDependencies(framework),
    };
  }

  /**
   * ⚡ Generate Function
   */
  async generateFunction(requirements, strategy, context) {
    const { language } = strategy;
    const functionName = requirements.name || "newFunction";

    const template =
      language === "typescript"
        ? this.getTypeScriptFunctionTemplate()
        : this.getJavaScriptFunctionTemplate();

    const code = this.processTemplate(template, {
      functionName,
      parameters: requirements.parameters || [],
      returnType: requirements.returnType || "void",
      async: requirements.async || false,
      description: requirements.description || "",
      typescript: language === "typescript",
    });

    return {
      code,
      files: [
        {
          name: `${functionName}.${language === "typescript" ? "ts" : "js"}`,
          content: code,
          type: "function",
        },
      ],
    };
  }

  /**
   * 🏗️ Generate Class
   */
  async generateClass(requirements, strategy, context) {
    const { language } = strategy;
    const className = requirements.name || "NewClass";

    const template =
      language === "typescript"
        ? this.getTypeScriptClassTemplate()
        : this.getJavaScriptClassTemplate();

    const code = this.processTemplate(template, {
      className,
      properties: requirements.properties || [],
      methods: requirements.methods || [],
      constructor: requirements.constructor || {},
      extends: requirements.extends || null,
      implements: requirements.implements || [],
      typescript: language === "typescript",
    });

    return {
      code,
      files: [
        {
          name: `${className}.${language === "typescript" ? "ts" : "js"}`,
          content: code,
          type: "class",
        },
      ],
    };
  }

  /**
   * 🌐 Generate API
   */
  async generateAPI(requirements, strategy, context) {
    const { framework } = strategy;
    const apiName = requirements.name || "api";

    let template;
    if (framework === "express" || framework === "node") {
      template = this.getExpressAPITemplate();
    } else if (framework === "fastapi") {
      template = this.getFastAPITemplate();
    } else {
      template = this.getGenericAPITemplate();
    }

    const code = this.processTemplate(template, {
      apiName,
      endpoints: requirements.endpoints || [],
      middleware: requirements.middleware || [],
      database: requirements.database || false,
      auth: requirements.auth || false,
    });

    return {
      code,
      files: [
        {
          name: `${apiName}.js`,
          content: code,
          type: "api",
        },
      ],
      dependencies: ["express", "cors", "helmet"],
    };
  }

  /**
   * 🧪 Generate Test
   */
  async generateTest(requirements, strategy, context) {
    const { framework } = strategy;
    const testName = requirements.name || "test";

    const template = this.getTestTemplate(framework.testFramework || "jest");

    const code = this.processTemplate(template, {
      testName,
      targetFile: requirements.targetFile || "",
      testCases: requirements.testCases || [],
      mocks: requirements.mocks || [],
    });

    return {
      code,
      files: [
        {
          name: `${testName}.test.js`,
          content: code,
          type: "test",
        },
      ],
      dependencies: ["jest", "@testing-library/jest-dom"],
    };
  }

  /**
   * ⚙️ Generate Config
   */
  async generateConfig(requirements, strategy, context) {
    const configType = requirements.configType || "general";
    const configName = requirements.name || "config";

    let template;
    switch (configType) {
      case "webpack":
        template = this.getWebpackConfigTemplate();
        break;
      case "eslint":
        template = this.getESLintConfigTemplate();
        break;
      case "prettier":
        template = this.getPrettierConfigTemplate();
        break;
      case "jest":
        template = this.getJestConfigTemplate();
        break;
      default:
        template = this.getGenericConfigTemplate();
    }

    const code = this.processTemplate(template, {
      configName,
      options: requirements.options || {},
    });

    return {
      code,
      files: [
        {
          name: `${configName}.js`,
          content: code,
          type: "config",
        },
      ],
    };
  }

  /**
   * 🏗️ Generate Project
   */
  async generateProject(requirements, strategy, context) {
    const projectName = requirements.name || "new-project";
    const { framework, language } = strategy;

    const files = [];
    const dependencies = [];

    // Generate package.json
    const packageJson = this.generatePackageJson(
      projectName,
      framework,
      language
    );
    files.push({
      name: "package.json",
      content: JSON.stringify(packageJson, null, 2),
      type: "config",
    });

    // Generate main entry file
    const entryFile = this.generateEntryFile(framework, language);
    files.push(entryFile);

    // Generate README
    const readme = this.generateReadme(projectName, framework);
    files.push({
      name: "README.md",
      content: readme,
      type: "documentation",
    });

    // Generate configuration files
    if (framework === "react") {
      files.push(...this.generateReactProjectFiles(language));
    } else if (framework === "vue") {
      files.push(...this.generateVueProjectFiles(language));
    } else if (framework === "express") {
      files.push(...this.generateExpressProjectFiles(language));
    }

    return {
      code: `// ${projectName} - Generated by NOX 🦊`,
      files,
      dependencies: this.getFrameworkDependencies(framework),
    };
  }

  /**
   * 🔧 Generate Generic Code
   */
  async generateGeneric(requirements, strategy, context) {
    const template = this.getGenericTemplate();

    const code = this.processTemplate(template, {
      name: requirements.name || "generated",
      description: requirements.description || "",
      language: strategy.language,
    });

    return {
      code,
      files: [
        {
          name: `${requirements.name || "generated"}.${
            strategy.language === "typescript" ? "ts" : "js"
          }`,
          content: code,
          type: "generic",
        },
      ],
    };
  }

  /**
   * 🔄 Process template with variables
   */
  processTemplate(template, variables) {
    let processed = template;

    // Replace template variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      processed = processed.replace(regex, value);
    }

    // Handle conditional blocks
    processed = this.processConditionals(processed, variables);

    // Handle loops
    processed = this.processLoops(processed, variables);

    return processed;
  }

  /**
   * 🔀 Process conditional template blocks
   */
  processConditionals(template, variables) {
    // Handle {{#if condition}} blocks
    const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    return template.replace(ifRegex, (match, condition, content) => {
      return variables[condition] ? content : "";
    });
  }

  /**
   * 🔁 Process loop template blocks
   */
  processLoops(template, variables) {
    // Handle {{#each array}} blocks
    const eachRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
    return template.replace(eachRegex, (match, arrayName, content) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) return "";

      return array
        .map((item) => {
          let itemContent = content;
          // Replace {{this}} with current item
          itemContent = itemContent.replace(/{{this}}/g, item);
          // Replace {{@index}} with current index
          itemContent = itemContent.replace(/{{@index}}/g, array.indexOf(item));
          return itemContent;
        })
        .join("");
    });
  }

  /**
   * 📦 Get framework dependencies
   */
  getFrameworkDependencies(framework) {
    return this.frameworks[framework]?.dependencies || [];
  }

  /**
   * 📄 Generate package.json
   */
  generatePackageJson(projectName, framework, language) {
    const base = {
      name: projectName,
      version: "1.0.0",
      description: `${projectName} - Generated by NOX 🦊`,
      main: "index.js",
      scripts: {
        start: "node index.js",
        test: "jest",
        lint: "eslint .",
        "lint:fix": "eslint . --fix",
      },
      keywords: [],
      author: "",
      license: "MIT",
      dependencies: {},
      devDependencies: {},
    };

    // Add framework-specific configuration
    if (framework === "react") {
      base.scripts = {
        ...base.scripts,
        start: "react-scripts start",
        build: "react-scripts build",
        test: "react-scripts test",
        eject: "react-scripts eject",
      };
      base.dependencies = {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
        "react-scripts": "5.0.1",
      };
      if (language === "typescript") {
        base.dependencies["@types/react"] = "^18.2.0";
        base.dependencies["@types/react-dom"] = "^18.2.0";
        base.dependencies["typescript"] = "^5.0.0";
      }
    }

    return base;
  }

  // Template getter methods
  getReactComponentTemplate() {
    return getReactComponentTemplate();
  }
  getVueComponentTemplate() {
    return getVueComponentTemplate();
  }
  getJavaScriptFunctionTemplate() {
    return getJavaScriptFunctionTemplate();
  }
  getTypeScriptFunctionTemplate() {
    return getTypeScriptFunctionTemplate();
  }
  getJavaScriptClassTemplate() {
    return getJavaScriptClassTemplate();
  }
  getTypeScriptClassTemplate() {
    return getTypeScriptClassTemplate();
  }
  getExpressAPITemplate() {
    return getExpressAPITemplate();
  }

  // Missing template methods that are called in initializeTemplates()
  getReactHookTemplate() {
    return `import { useState, useEffect } from 'react';

/**
 * 🎣 {{hookName}} Hook
 * Generated by NOX 🦊
 */
function {{hookName}}({{#if parameters}}{{#each parameters}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}) {
{{#each state}}
  const [{{this.name}}, set{{this.name}}] = useState({{this.defaultValue}});
{{/each}}

{{#each effects}}
  useEffect(() => {
    // TODO: Implement {{this.name}} effect
{{#if this.cleanup}}
    return () => {
      // Cleanup logic
    };
{{/if}}
  }, [{{#each this.dependencies}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}]);

{{/each}}
{{#each methods}}
  const {{this.name}} = {{#if this.async}}async {{/if}}({{#each this.params}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}) => {
    // TODO: Implement {{this.name}}
  };

{{/each}}
  return {
{{#each state}}
    {{this.name}},
    set{{this.name}},
{{/each}}
{{#each methods}}
    {{this.name}},
{{/each}}
  };
}

export default {{hookName}};
`;
  }

  getReactContextTemplate() {
    return `import React, { createContext, useContext, useReducer } from 'react';

/**
 * 🌐 {{contextName}} Context
 * Generated by NOX 🦊
 */

// Initial state
const initialState = {
{{#each state}}
  {{this.name}}: {{this.defaultValue}},
{{/each}}
};

// Action types
const ActionTypes = {
{{#each actions}}
  {{this.name}}: '{{this.name}}',
{{/each}}
};

// Reducer
function {{contextName}}Reducer(state, action) {
  switch (action.type) {
{{#each actions}}
    case ActionTypes.{{this.name}}:
      return {
        ...state,
        // TODO: Implement {{this.name}} action
      };
{{/each}}
    default:
      return state;
  }
}

// Context
const {{contextName}}Context = createContext();

// Provider component
export function {{contextName}}Provider({ children }) {
  const [state, dispatch] = useReducer({{contextName}}Reducer, initialState);

{{#each methods}}
  const {{this.name}} = ({{#each this.params}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}) => {
    // TODO: Implement {{this.name}}
    dispatch({ type: ActionTypes.{{this.actionType}}, payload: { {{#each this.params}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}} } });
  };

{{/each}}
  const value = {
    ...state,
{{#each methods}}
    {{this.name}},
{{/each}}
  };

  return (
    <{{contextName}}Context.Provider value={value}>
      {children}
    </{{contextName}}Context.Provider>
  );
}

// Hook to use context
export function use{{contextName}}() {
  const context = useContext({{contextName}}Context);
  if (!context) {
    throw new Error('use{{contextName}} must be used within a {{contextName}}Provider');
  }
  return context;
}

export { ActionTypes };
`;
  }

  getVueComposableTemplate() {
    return `import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';

/**
 * 🎯 {{composableName}} Composable
 * Generated by NOX 🦊
 */
export function {{composableName}}({{#if parameters}}{{#each parameters}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}) {
{{#each state}}
  const {{this.name}} = {{#if this.reactive}}reactive({{this.defaultValue}}){{else}}ref({{this.defaultValue}}){{/if}};
{{/each}}

{{#each computed}}
  const {{this.name}} = computed(() => {
    // TODO: Implement {{this.name}} computed property
    return null;
  });

{{/each}}
{{#each methods}}
  const {{this.name}} = {{#if this.async}}async {{/if}}({{#each this.params}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}) => {
    // TODO: Implement {{this.name}}
  };

{{/each}}
  onMounted(() => {
    // TODO: Setup logic
  });

  onUnmounted(() => {
    // TODO: Cleanup logic
  });

  return {
{{#each state}}
    {{this.name}},
{{/each}}
{{#each computed}}
    {{this.name}},
{{/each}}
{{#each methods}}
    {{this.name}},
{{/each}}
  };
}
`;
  }

  getExpressTemplate() {
    return getExpressAPITemplate();
  }

  getMiddlewareTemplate() {
    return `/**
 * 🔧 {{middlewareName}} Middleware
 * Generated by NOX 🦊
 */

function {{middlewareName}}({{#if options}}options = {}{{/if}}) {
  return (req, res, next) => {
    try {
      // TODO: Implement middleware logic

{{#if validation}}
      // Validation logic
      if (!req.body) {
        return res.status(400).json({ error: 'Request body is required' });
      }
{{/if}}

{{#if authentication}}
      // Authentication logic
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ error: 'Authorization token required' });
      }
{{/if}}

{{#if logging}}
      // Logging
      console.log(\`\${req.method} \${req.path} - \${new Date().toISOString()}\`);
{{/if}}

      next();
    } catch (error) {
      console.error('Middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

module.exports = {{middlewareName}};
`;
  }

  getControllerTemplate() {
    return `/**
 * 🎮 {{controllerName}} Controller
 * Generated by NOX 🦊
 */

class {{controllerName}}Controller {
{{#each methods}}
  /**
   * {{this.description}}
   */
  {{#if this.async}}async {{/if}}{{this.name}}(req, res) {
    try {
{{#if this.validation}}
      // Validation
      const { {{#each this.params}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}} } = req.{{this.source}};

      if (!{{this.params.0.name}}) {
        return res.status(400).json({ error: '{{this.params.0.name}} is required' });
      }
{{/if}}

      // TODO: Implement {{this.name}} logic

      res.json({
        success: true,
        message: '{{this.name}} executed successfully',
        data: null
      });
    } catch (error) {
      console.error('{{this.name}} error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

{{/each}}
}

module.exports = new {{controllerName}}Controller();
`;
  }

  getGenericComponentTemplate() {
    return `// {{componentName}} Component
// Generated by NOX 🦊

function {{componentName}}({{#if props}}props{{/if}}) {
  // TODO: Implement component logic
  return {
    render: function() {
      return '<div class="{{componentName}}">{{componentName}}</div>';
    }
  };
}

module.exports = {{componentName}};
`;
  }

  getGenericAPITemplate() {
    return `// {{apiName}} API
// Generated by NOX 🦊

const {{apiName}} = {
{{#each endpoints}}
  {{this.name}}: function({{#each this.params}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}) {
    // TODO: Implement {{this.name}}
    return { success: true, data: null };
  }{{#unless @last}},{{/unless}}
{{/each}}
};

module.exports = {{apiName}};
`;
  }

  getGenericTemplate() {
    return `// {{name}}
// Generated by NOX 🦊
// {{description}}

// TODO: Implement {{name}}

module.exports = {};
`;
  }

  // Additional missing template methods
  getPythonClassTemplate() {
    return `"""
🐍 {{className}} Class
Generated by NOX 🦊
"""

{{#if imports}}
{{#each imports}}
{{this}}
{{/each}}

{{/if}}
class {{className}}{{#if parentClass}}({{parentClass}}){{/if}}:
    """
    {{description}}
    """

    def __init__(self{{#if parameters}}, {{#each parameters}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}):
        """Initialize {{className}}"""
{{#if parentClass}}
        super().__init__()
{{/if}}
{{#each attributes}}
        self.{{this.name}} = {{this.defaultValue}}
{{/each}}

{{#each methods}}
    {{#if this.async}}async {{/if}}def {{this.name}}(self{{#if this.params}}, {{#each this.params}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}):
        """{{this.description}}"""
        # TODO: Implement {{this.name}}
        {{#if this.async}}pass{{else}}return None{{/if}}

{{/each}}
    def __str__(self):
        return f"{{className}}({{#each attributes}}{{this.name}}={self.{{this.name}}}{{#unless @last}}, {{/unless}}{{/each}})"

    def __repr__(self):
        return self.__str__()
`;
  }

  getPythonFunctionTemplate() {
    return `"""
🐍 {{functionName}} Function
Generated by NOX 🦊
"""

{{#if imports}}
{{#each imports}}
{{this}}
{{/each}}

{{/if}}
{{#if async}}async {{/if}}def {{functionName}}({{#each parameters}}{{this.name}}{{#if this.type}}: {{this.type}}{{/if}}{{#if this.default}} = {{this.default}}{{/if}}{{#unless @last}}, {{/unless}}{{/each}}){{#if returnType}} -> {{returnType}}{{/if}}:
    """
    {{description}}

{{#each parameters}}
    Args:
        {{this.name}} ({{this.type}}): {{this.description}}
{{/each}}

    Returns:
        {{returnType}}: {{returnDescription}}
    """
    # TODO: Implement {{functionName}}
    {{#if async}}
    try:
        # Async implementation here
        return None
    except Exception as e:
        print(f"Error in {{functionName}}: {e}")
        raise
    {{else}}
    return None
    {{/if}}
`;
  }

  getFastAPITemplate() {
    return `"""
🚀 {{apiName}} FastAPI Application
Generated by NOX 🦊
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

app = FastAPI(
    title="{{apiName}}",
    description="Generated by NOX 🦊",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

{{#each models}}
class {{this.name}}(BaseModel):
{{#each this.fields}}
    {{this.name}}: {{this.type}}{{#if this.optional}} = None{{/if}}
{{/each}}

{{/each}}

@app.get("/")
async def root():
    return {"message": "Welcome to {{apiName}} API! 🦊", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "OK", "service": "{{apiName}}"}

{{#each endpoints}}
@app.{{this.method}}("{{this.path}}")
async def {{this.name}}({{#each this.params}}{{this.name}}: {{this.type}}{{#unless @last}}, {{/unless}}{{/each}}):
    """{{this.description}}"""
    try:
        # TODO: Implement {{this.name}}
        return {"message": "{{this.name}} endpoint", "data": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

{{/each}}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;
  }

  getTypeScriptInterfaceTemplate() {
    return `/**
 * 🔷 {{interfaceName}} Interface
 * Generated by NOX 🦊
 */

{{#if imports}}
{{#each imports}}
{{this}}
{{/each}}

{{/if}}
export interface {{interfaceName}}{{#if extends}} extends {{extends}}{{/if}} {
{{#each properties}}
  {{this.name}}{{#if this.optional}}?{{/if}}: {{this.type}};{{#if this.description}} // {{this.description}}{{/if}}
{{/each}}
{{#each methods}}
  {{this.name}}({{#each this.params}}{{this.name}}: {{this.type}}{{#unless @last}}, {{/unless}}{{/each}}): {{this.returnType}};{{#if this.description}} // {{this.description}}{{/if}}
{{/each}}
}

{{#if defaultImplementation}}
export const default{{interfaceName}}: {{interfaceName}} = {
{{#each properties}}
  {{this.name}}: {{this.defaultValue}},
{{/each}}
{{#each methods}}
  {{this.name}}: ({{#each this.params}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}) => {
    // TODO: Implement {{this.name}}
    {{#if this.returnType}}return null as any;{{/if}}
  },
{{/each}}
};
{{/if}}
`;
  }

  getTypeScriptTypeTemplate() {
    return `/**
 * 🔷 {{typeName}} Type
 * Generated by NOX 🦊
 */

{{#if imports}}
{{#each imports}}
{{this}}
{{/each}}

{{/if}}
{{#if union}}
export type {{typeName}} = {{#each options}}'{{this}}'{{#unless @last}} | {{/unless}}{{/each}};
{{else if generic}}
export type {{typeName}}<{{#each generics}}{{this.name}}{{#if this.constraint}} extends {{this.constraint}}{{/if}}{{#unless @last}}, {{/unless}}{{/each}}> = {
{{#each properties}}
  {{this.name}}{{#if this.optional}}?{{/if}}: {{this.type}};{{#if this.description}} // {{this.description}}{{/if}}
{{/each}}
};
{{else}}
export type {{typeName}} = {
{{#each properties}}
  {{this.name}}{{#if this.optional}}?{{/if}}: {{this.type}};{{#if this.description}} // {{this.description}}{{/if}}
{{/each}}
};
{{/if}}

{{#if utilities}}
// Utility types
{{#each utilities}}
export type {{this.name}} = {{this.definition}};
{{/each}}
{{/if}}
`;
  }

  // Missing pattern methods that are called in initializePatterns()
  getCRUDPattern() {
    return {
      name: "CRUD Operations",
      description: "Create, Read, Update, Delete operations pattern",
      templates: {
        controller: `/**
 * 🔄 {{entityName}} CRUD Controller
 * Generated by NOX 🦊
 */

class {{entityName}}Controller {
  /**
   * 📝 Create new {{entityName}}
   */
  async create(req, res) {
    try {
      const {{entityName.toLowerCase()}}Data = req.body;

      // Validation
      if (!{{entityName.toLowerCase()}}Data) {
        return res.status(400).json({ error: '{{entityName}} data is required' });
      }

      // TODO: Implement create logic
      const new{{entityName}} = await {{entityName}}Service.create({{entityName.toLowerCase()}}Data);

      res.status(201).json({
        success: true,
        message: '{{entityName}} created successfully',
        data: new{{entityName}}
      });
    } catch (error) {
      console.error('Create {{entityName}} error:', error);
      res.status(500).json({ error: 'Failed to create {{entityName}}' });
    }
  }

  /**
   * 📖 Get all {{entityName}}s
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;

      // TODO: Implement get all logic with pagination
      const {{entityName.toLowerCase()}}s = await {{entityName}}Service.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });

      res.json({
        success: true,
        data: {{entityName.toLowerCase()}}s,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: {{entityName.toLowerCase()}}s.total || 0
        }
      });
    } catch (error) {
      console.error('Get {{entityName}}s error:', error);
      res.status(500).json({ error: 'Failed to fetch {{entityName}}s' });
    }
  }

  /**
   * 🔍 Get {{entityName}} by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      // TODO: Implement get by ID logic
      const {{entityName.toLowerCase()}} = await {{entityName}}Service.getById(id);

      if (!{{entityName.toLowerCase()}}) {
        return res.status(404).json({ error: '{{entityName}} not found' });
      }

      res.json({
        success: true,
        data: {{entityName.toLowerCase()}}
      });
    } catch (error) {
      console.error('Get {{entityName}} error:', error);
      res.status(500).json({ error: 'Failed to fetch {{entityName}}' });
    }
  }

  /**
   * ✏️ Update {{entityName}}
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      if (!updateData) {
        return res.status(400).json({ error: 'Update data is required' });
      }

      // TODO: Implement update logic
      const updated{{entityName}} = await {{entityName}}Service.update(id, updateData);

      if (!updated{{entityName}}) {
        return res.status(404).json({ error: '{{entityName}} not found' });
      }

      res.json({
        success: true,
        message: '{{entityName}} updated successfully',
        data: updated{{entityName}}
      });
    } catch (error) {
      console.error('Update {{entityName}} error:', error);
      res.status(500).json({ error: 'Failed to update {{entityName}}' });
    }
  }

  /**
   * 🗑️ Delete {{entityName}}
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      // TODO: Implement delete logic
      const deleted = await {{entityName}}Service.delete(id);

      if (!deleted) {
        return res.status(404).json({ error: '{{entityName}} not found' });
      }

      res.json({
        success: true,
        message: '{{entityName}} deleted successfully'
      });
    } catch (error) {
      console.error('Delete {{entityName}} error:', error);
      res.status(500).json({ error: 'Failed to delete {{entityName}}' });
    }
  }
}

module.exports = new {{entityName}}Controller();
`,
        service: `/**
 * 🔄 {{entityName}} Service
 * Generated by NOX 🦊
 */

class {{entityName}}Service {
  /**
   * 📝 Create new {{entityName}}
   */
  async create({{entityName.toLowerCase()}}Data) {
    try {
      // TODO: Implement database create logic
      // Example: return await {{entityName}}Model.create({{entityName.toLowerCase()}}Data);
      return {{entityName.toLowerCase()}}Data;
    } catch (error) {
      console.error('{{entityName}}Service.create error:', error);
      throw error;
    }
  }

  /**
   * 📖 Get all {{entityName}}s
   */
  async getAll(options = {}) {
    try {
      const { page = 1, limit = 10, search } = options;

      // TODO: Implement database query logic with pagination
      // Example: return await {{entityName}}Model.findAndCountAll({ limit, offset: (page - 1) * limit });
      return {
        data: [],
        total: 0,
        page,
        limit
      };
    } catch (error) {
      console.error('{{entityName}}Service.getAll error:', error);
      throw error;
    }
  }

  /**
   * 🔍 Get {{entityName}} by ID
   */
  async getById(id) {
    try {
      // TODO: Implement database find by ID logic
      // Example: return await {{entityName}}Model.findByPk(id);
      return null;
    } catch (error) {
      console.error('{{entityName}}Service.getById error:', error);
      throw error;
    }
  }

  /**
   * ✏️ Update {{entityName}}
   */
  async update(id, updateData) {
    try {
      // TODO: Implement database update logic
      // Example: return await {{entityName}}Model.update(updateData, { where: { id } });
      return updateData;
    } catch (error) {
      console.error('{{entityName}}Service.update error:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Delete {{entityName}}
   */
  async delete(id) {
    try {
      // TODO: Implement database delete logic
      // Example: return await {{entityName}}Model.destroy({ where: { id } });
      return true;
    } catch (error) {
      console.error('{{entityName}}Service.delete error:', error);
      throw error;
    }
  }
}

module.exports = new {{entityName}}Service();
`,
      },
      routes: [
        {
          method: "POST",
          path: "/{{entityName.toLowerCase()}}",
          handler: "create",
        },
        {
          method: "GET",
          path: "/{{entityName.toLowerCase()}}",
          handler: "getAll",
        },
        {
          method: "GET",
          path: "/{{entityName.toLowerCase()}}/:id",
          handler: "getById",
        },
        {
          method: "PUT",
          path: "/{{entityName.toLowerCase()}}/:id",
          handler: "update",
        },
        {
          method: "DELETE",
          path: "/{{entityName.toLowerCase()}}/:id",
          handler: "delete",
        },
      ],
    };
  }

  getAuthPattern() {
    return {
      name: "Authentication Pattern",
      description: "User authentication and authorization patterns",
      templates: {
        middleware: `/**
 * 🔐 Authentication Middleware
 * Generated by NOX 🦊
 */

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // TODO: Replace with your JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
`,
        controller: `/**
 * 🔐 Authentication Controller
 * Generated by NOX 🦊
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthController {
  /**
   * 📝 User Registration
   */
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // TODO: Check if user already exists
      // const existingUser = await UserService.findByEmail(email);

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // TODO: Create user in database
      const newUser = {
        email,
        password: hashedPassword,
        name
      };

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  /**
   * 🔑 User Login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // TODO: Find user by email
      // const user = await UserService.findByEmail(email);

      // For demo purposes, using mock user
      const user = null;

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  /**
   * 🔄 Refresh Token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      // TODO: Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret');

      // Generate new access token
      const newToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token: newToken
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  /**
   * 🚪 User Logout
   */
  async logout(req, res) {
    try {
      // TODO: Implement token blacklisting if needed

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }
}

module.exports = new AuthController();
`,
      },
      routes: [
        { method: "POST", path: "/auth/register", handler: "register" },
        { method: "POST", path: "/auth/login", handler: "login" },
        { method: "POST", path: "/auth/refresh", handler: "refreshToken" },
        { method: "POST", path: "/auth/logout", handler: "logout" },
      ],
    };
  }

  getValidationPattern() {
    return {
      name: "Validation Pattern",
      description: "Input validation and sanitization patterns",
      templates: {
        middleware: `/**
 * ✅ Validation Middleware
 * Generated by NOX 🦊
 */

function validateRequest(schema) {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body);

      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      req.body = value; // Use sanitized values
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json({ error: 'Validation error' });
    }
  };
}

module.exports = { validateRequest };
`,
        schema: `/**
 * ✅ {{schemaName}} Validation Schema
 * Generated by NOX 🦊
 */

const Joi = require('joi');

const {{schemaName}}Schema = Joi.object({
{{#each fields}}
  {{this.name}}: Joi.{{this.type}}(){{#if this.required}}.required(){{/if}}{{#if this.min}}.min({{this.min}}){{/if}}{{#if this.max}}.max({{this.max}}){{/if}},
{{/each}}
});

module.exports = {
  {{schemaName}}Schema
};
`,
      },
    };
  }

  getTestingPattern() {
    return {
      name: "Testing Pattern",
      description: "Unit testing and integration testing patterns",
      templates: {
        unit: `/**
 * 🧪 {{testName}} Unit Tests
 * Generated by NOX 🦊
 */

const {{moduleName}} = require('{{modulePath}}');

describe('{{testName}}', () => {
{{#each testCases}}
  {{#if this.async}}
  it('{{this.description}}', async () => {
    // Arrange
    {{#each this.arrange}}
    {{this}}
    {{/each}}

    // Act
    const result = await {{../moduleName}}.{{this.method}}({{#each this.params}}{{this}}{{#unless @last}}, {{/unless}}{{/each}});

    // Assert
    {{#each this.assertions}}
    {{this}}
    {{/each}}
  });
  {{else}}
  it('{{this.description}}', () => {
    // Arrange
    {{#each this.arrange}}
    {{this}}
    {{/each}}

    // Act
    const result = {{../moduleName}}.{{this.method}}({{#each this.params}}{{this}}{{#unless @last}}, {{/unless}}{{/each}});

    // Assert
    {{#each this.assertions}}
    {{this}}
    {{/each}}
  });
  {{/if}}

{{/each}}
});
`,
        integration: `/**
 * 🔗 {{testName}} Integration Tests
 * Generated by NOX 🦊
 */

const request = require('supertest');
const app = require('{{appPath}}');

describe('{{testName}} Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database or services
  });

  afterAll(async () => {
    // Cleanup test database or services
  });

{{#each endpoints}}
  describe('{{this.method}} {{this.path}}', () => {
    it('should {{this.description}}', async () => {
      const response = await request(app)
        .{{this.method.toLowerCase()}}('{{this.path}}')
        {{#if this.body}}.send({{this.body}}){{/if}}
        {{#if this.headers}}{{#each this.headers}}.set('{{@key}}', '{{this}}'){{/each}}{{/if}};

      expect(response.status).toBe({{this.expectedStatus}});
      {{#each this.assertions}}
      {{this}}
      {{/each}}
    });
  });

{{/each}}
});
`,
      },
    };
  }

  getErrorHandlingPattern() {
    return {
      name: "Error Handling Pattern",
      description: "Comprehensive error handling and logging patterns",
      templates: {
        middleware: `/**
 * 🚨 Error Handling Middleware
 * Generated by NOX 🦊
 */

function errorHandler(err, req, res, next) {
  // Log error details
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Determine error type and response
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not Found';
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    },
    timestamp: new Date().toISOString(),
    path: req.url
  });
}

// 404 handler
function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      message: 'Route not found',
      path: req.url,
      method: req.method
    },
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
`,
        customErrors: `/**
 * 🚨 Custom Error Classes
 * Generated by NOX 🦊
 */

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = []) {
    super(message, 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(\`\${resource} not found\`, 404);
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError
};
`,
      },
    };
  }

  getTestTemplate(framework = "jest") {
    if (framework === "jest") {
      return `// {{testName}} Test Suite
// Generated by NOX 🦊

{{#if targetFile}}
const {{testName}} = require('{{targetFile}}');
{{/if}}

describe('{{testName}}', () => {
{{#each testCases}}
  test('{{this.description}}', {{#if this.async}}async {{/if}}() => {
    // TODO: Implement test case
    {{#if this.async}}
    // await expect({{../testName}}.someMethod()).resolves.toBe(expected);
    {{else}}
    // expect({{../testName}}.someMethod()).toBe(expected);
    {{/if}}
  });

{{/each}}
});
`;
    }
    return this.getGenericTemplate();
  }

  getWebpackConfigTemplate() {
    return `// Webpack Configuration
// Generated by NOX 🦊

const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  devServer: {
    contentBase: './dist',
    hot: true
  }
};
`;
  }

  getESLintConfigTemplate() {
    return `// ESLint Configuration
// Generated by NOX 🦊

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always']
  }
};
`;
  }

  getPrettierConfigTemplate() {
    return `// Prettier Configuration
// Generated by NOX 🦊

module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false
};
`;
  }

  getJestConfigTemplate() {
    return `// Jest Configuration
// Generated by NOX 🦊

module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/?(*.)(spec|test).{js,jsx,ts,tsx}'
  ],
  transform: {
    '^.+\\\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
`;
  }

  getGenericConfigTemplate() {
    return `// {{configName}} Configuration
// Generated by NOX 🦊

module.exports = {
{{#each options}}
  {{@key}}: {{this}}{{#unless @last}},{{/unless}}
{{/each}}
};
`;
  }

  generateEntryFile(framework, language) {
    if (framework === "react") {
      const ext = language === "typescript" ? "tsx" : "jsx";
      return {
        name: `src/index.${ext}`,
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
        type: "entry",
      };
    } else if (framework === "express") {
      return {
        name: "src/index.js",
        content: `const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
});
`,
        type: "entry",
      };
    }

    return {
      name: "src/index.js",
      content: `// Main entry point
// Generated by NOX 🦊

console.log('Hello from NOX! 🦊');
`,
      type: "entry",
    };
  }

  generateReadme(projectName, framework) {
    return `# ${projectName}

Generated by NOX 🦊 - Your Arctic coding fox

## Description

This project was intelligently generated using NOX AI coding assistant.

## Framework

- **Framework**: ${framework}
- **Generated**: ${new Date().toISOString()}

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
\`\`\`

## Features

- ✅ Modern ${framework} setup
- ✅ ESLint configuration
- ✅ Prettier formatting
- ✅ Jest testing framework
- ✅ Production-ready build

## Generated by NOX

This project was created using NOX AI coding assistant with enterprise-grade templates and best practices.

---

🦊 **NOX** - Your Arctic coding fox
`;
  }

  generateReactProjectFiles(language) {
    const ext = language === "typescript" ? "tsx" : "jsx";
    return [
      {
        name: `src/App.${ext}`,
        content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to your NOX-generated React app! 🦊</h1>
        <p>Your Arctic coding fox has set up everything for you.</p>
      </header>
    </div>
  );
}

export default App;
`,
        type: "component",
      },
      {
        name: "src/App.css",
        content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

h1 {
  margin-bottom: 20px;
}
`,
        type: "style",
      },
    ];
  }

  generateVueProjectFiles(language) {
    return [
      {
        name: "src/App.vue",
        content: `<template>
  <div id="app">
    <header>
      <h1>Welcome to your NOX-generated Vue app! 🦊</h1>
      <p>Your Arctic coding fox has set up everything for you.</p>
    </header>
  </div>
</template>

<script${language === "typescript" ? ' lang="ts"' : ""}>
export default {
  name: 'App'
};
</script>

<style>
#app {
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

header {
  background-color: #42b883;
  padding: 20px;
  color: white;
}
</style>
`,
        type: "component",
      },
    ];
  }

  generateExpressProjectFiles(language) {
    return [
      {
        name: "src/app.js",
        content: `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to your NOX-generated Express API! 🦊',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
`,
        type: "api",
      },
    ];
  }
}

module.exports = NoxCodeGenerator;
