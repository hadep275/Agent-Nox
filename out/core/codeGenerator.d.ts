export = NoxCodeGenerator;
/**
 * 🦊 NOX Intelligent Code Generator
 * Enterprise-grade code generation with templates, patterns, and AI-driven creation
 */
declare class NoxCodeGenerator {
    constructor(logger: any, performanceMonitor: any, contextManager: any);
    logger: any;
    performanceMonitor: any;
    contextManager: any;
    isInitialized: boolean;
    templates: {
        react: {
            component: string;
            hook: string;
            context: string;
        };
        vue: {
            component: string;
            composable: string;
        };
        node: {
            express: string;
            middleware: string;
            controller: string;
        };
        python: {
            class: string;
            function: string;
            fastapi: string;
        };
        typescript: {
            interface: string;
            type: string;
            class: string;
        };
    };
    patterns: {
        crud: {
            name: string;
            description: string;
            templates: {
                controller: string;
                service: string;
            };
            routes: {
                method: string;
                path: string;
                handler: string;
            }[];
        };
        auth: {
            name: string;
            description: string;
            templates: {
                middleware: string;
                controller: string;
            };
            routes: {
                method: string;
                path: string;
                handler: string;
            }[];
        };
        validation: {
            name: string;
            description: string;
            templates: {
                middleware: string;
                schema: string;
            };
        };
        testing: {
            name: string;
            description: string;
            templates: {
                unit: string;
                integration: string;
            };
        };
        errorHandling: {
            name: string;
            description: string;
            templates: {
                middleware: string;
                customErrors: string;
            };
        };
    };
    frameworks: {
        react: {
            dependencies: string[];
            devDependencies: string[];
            fileExtensions: string[];
            testFramework: string;
        };
        vue: {
            dependencies: string[];
            devDependencies: string[];
            fileExtensions: string[];
            testFramework: string;
        };
        angular: {
            dependencies: string[];
            devDependencies: string[];
            fileExtensions: string[];
            testFramework: string;
        };
        nextjs: {
            dependencies: string[];
            devDependencies: string[];
            fileExtensions: string[];
            testFramework: string;
        };
    };
    /**
     * 🎨 Generate intelligent code based on requirements
     */
    generateCode(requirements: any, context?: {}): Promise<{
        success: boolean;
        code: any;
        files: {
            name: string;
            content: any;
            type: string;
        }[];
        metadata: {
            strategy: string;
            framework: any;
            language: any;
            generationTime: any;
            patterns: string[];
            dependencies: any;
        };
    }>;
    /**
     * 🧠 Analyze requirements to determine generation strategy
     */
    analyzeRequirements(requirements: any, context: any): Promise<{
        type: string;
        language: any;
        framework: any;
        patterns: string[];
        projectInfo: {
            language: string;
            framework: string;
            packageManager: string;
            testFramework: string;
            buildTool: string;
        };
        complexity: string;
    }>;
    /**
     * 🔍 Detect project information from context
     */
    detectProjectInfo(context: any): Promise<{
        language: string;
        framework: string;
        packageManager: string;
        testFramework: string;
        buildTool: string;
    }>;
    /**
     * 🎯 Determine generation type from requirements
     */
    determineGenerationType(requirements: any, patterns: any): "class" | "component" | "function" | "api" | "test" | "config" | "generic" | "project";
    /**
     * 🔍 Detect patterns in requirement text
     */
    detectPatterns(text: any): string[];
    /**
     * 📊 Assess complexity of requirements
     */
    assessComplexity(requirements: any, patterns: any): string;
    /**
     * 🎨 Initialize code templates
     */
    initializeTemplates(): {
        react: {
            component: string;
            hook: string;
            context: string;
        };
        vue: {
            component: string;
            composable: string;
        };
        node: {
            express: string;
            middleware: string;
            controller: string;
        };
        python: {
            class: string;
            function: string;
            fastapi: string;
        };
        typescript: {
            interface: string;
            type: string;
            class: string;
        };
    };
    /**
     * 🎯 Initialize code patterns
     */
    initializePatterns(): {
        crud: {
            name: string;
            description: string;
            templates: {
                controller: string;
                service: string;
            };
            routes: {
                method: string;
                path: string;
                handler: string;
            }[];
        };
        auth: {
            name: string;
            description: string;
            templates: {
                middleware: string;
                controller: string;
            };
            routes: {
                method: string;
                path: string;
                handler: string;
            }[];
        };
        validation: {
            name: string;
            description: string;
            templates: {
                middleware: string;
                schema: string;
            };
        };
        testing: {
            name: string;
            description: string;
            templates: {
                unit: string;
                integration: string;
            };
        };
        errorHandling: {
            name: string;
            description: string;
            templates: {
                middleware: string;
                customErrors: string;
            };
        };
    };
    /**
     * 🏗️ Initialize framework configurations
     */
    initializeFrameworks(): {
        react: {
            dependencies: string[];
            devDependencies: string[];
            fileExtensions: string[];
            testFramework: string;
        };
        vue: {
            dependencies: string[];
            devDependencies: string[];
            fileExtensions: string[];
            testFramework: string;
        };
        angular: {
            dependencies: string[];
            devDependencies: string[];
            fileExtensions: string[];
            testFramework: string;
        };
        nextjs: {
            dependencies: string[];
            devDependencies: string[];
            fileExtensions: string[];
            testFramework: string;
        };
    };
    /**
     * 🎨 Generate React Component
     */
    generateComponent(requirements: any, strategy: any, context: any): Promise<{
        code: any;
        files: {
            name: string;
            content: any;
            type: string;
        }[];
        dependencies: any;
    }>;
    /**
     * ⚡ Generate Function
     */
    generateFunction(requirements: any, strategy: any, context: any): Promise<{
        code: any;
        files: {
            name: string;
            content: any;
            type: string;
        }[];
    }>;
    /**
     * 🏗️ Generate Class
     */
    generateClass(requirements: any, strategy: any, context: any): Promise<{
        code: any;
        files: {
            name: string;
            content: any;
            type: string;
        }[];
    }>;
    /**
     * 🌐 Generate API
     */
    generateAPI(requirements: any, strategy: any, context: any): Promise<{
        code: any;
        files: {
            name: string;
            content: any;
            type: string;
        }[];
        dependencies: string[];
    }>;
    /**
     * 🧪 Generate Test
     */
    generateTest(requirements: any, strategy: any, context: any): Promise<{
        code: any;
        files: {
            name: string;
            content: any;
            type: string;
        }[];
        dependencies: string[];
    }>;
    /**
     * ⚙️ Generate Config
     */
    generateConfig(requirements: any, strategy: any, context: any): Promise<{
        code: any;
        files: {
            name: string;
            content: any;
            type: string;
        }[];
    }>;
    /**
     * 🏗️ Generate Project
     */
    generateProject(requirements: any, strategy: any, context: any): Promise<{
        code: string;
        files: {
            name: string;
            content: string;
            type: string;
        }[];
        dependencies: any;
    }>;
    /**
     * 🔧 Generate Generic Code
     */
    generateGeneric(requirements: any, strategy: any, context: any): Promise<{
        code: any;
        files: {
            name: string;
            content: any;
            type: string;
        }[];
    }>;
    /**
     * 🔄 Process template with variables
     */
    processTemplate(template: any, variables: any): any;
    /**
     * 🔀 Process conditional template blocks
     */
    processConditionals(template: any, variables: any): any;
    /**
     * 🔁 Process loop template blocks
     */
    processLoops(template: any, variables: any): any;
    /**
     * 📦 Get framework dependencies
     */
    getFrameworkDependencies(framework: any): any;
    /**
     * 📄 Generate package.json
     */
    generatePackageJson(projectName: any, framework: any, language: any): {
        name: any;
        version: string;
        description: string;
        main: string;
        scripts: {
            start: string;
            test: string;
            lint: string;
            "lint:fix": string;
        };
        keywords: never[];
        author: string;
        license: string;
        dependencies: {};
        devDependencies: {};
    };
    getReactComponentTemplate(): string;
    getVueComponentTemplate(): string;
    getJavaScriptFunctionTemplate(): string;
    getTypeScriptFunctionTemplate(): string;
    getJavaScriptClassTemplate(): string;
    getTypeScriptClassTemplate(): string;
    getExpressAPITemplate(): string;
    getReactHookTemplate(): string;
    getReactContextTemplate(): string;
    getVueComposableTemplate(): string;
    getExpressTemplate(): string;
    getMiddlewareTemplate(): string;
    getControllerTemplate(): string;
    getGenericComponentTemplate(): string;
    getGenericAPITemplate(): string;
    getGenericTemplate(): string;
    getPythonClassTemplate(): string;
    getPythonFunctionTemplate(): string;
    getFastAPITemplate(): string;
    getTypeScriptInterfaceTemplate(): string;
    getTypeScriptTypeTemplate(): string;
    getCRUDPattern(): {
        name: string;
        description: string;
        templates: {
            controller: string;
            service: string;
        };
        routes: {
            method: string;
            path: string;
            handler: string;
        }[];
    };
    getAuthPattern(): {
        name: string;
        description: string;
        templates: {
            middleware: string;
            controller: string;
        };
        routes: {
            method: string;
            path: string;
            handler: string;
        }[];
    };
    getValidationPattern(): {
        name: string;
        description: string;
        templates: {
            middleware: string;
            schema: string;
        };
    };
    getTestingPattern(): {
        name: string;
        description: string;
        templates: {
            unit: string;
            integration: string;
        };
    };
    getErrorHandlingPattern(): {
        name: string;
        description: string;
        templates: {
            middleware: string;
            customErrors: string;
        };
    };
    getTestTemplate(framework?: string): string;
    getWebpackConfigTemplate(): string;
    getESLintConfigTemplate(): string;
    getPrettierConfigTemplate(): string;
    getJestConfigTemplate(): string;
    getGenericConfigTemplate(): string;
    generateEntryFile(framework: any, language: any): {
        name: string;
        content: string;
        type: string;
    };
    generateReadme(projectName: any, framework: any): string;
    generateReactProjectFiles(language: any): {
        name: string;
        content: string;
        type: string;
    }[];
    generateVueProjectFiles(language: any): {
        name: string;
        content: string;
        type: string;
    }[];
    generateExpressProjectFiles(language: any): {
        name: string;
        content: string;
        type: string;
    }[];
}
//# sourceMappingURL=codeGenerator.d.ts.map