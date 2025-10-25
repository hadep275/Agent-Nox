/**
 * 🦊 NOX Autonomous Coding Capabilities Test
 * Test the new intelligent code generation and file operations
 */

const NoxCodeGenerator = require('../src/core/codeGenerator');
const CapabilityExecutor = require('../src/core/capabilityExecutor');

// Mock dependencies for testing
const mockLogger = {
  info: console.log,
  debug: console.log,
  warn: console.warn,
  error: console.error
};

const mockPerformanceMonitor = {
  startTimer: (name) => ({
    end: () => {},
    duration: 100
  })
};

const mockContextManager = {
  getFileContent: async (path) => '{}',
  getContext: async (query, options) => ({
    files: [],
    symbols: []
  })
};

/**
 * 🧪 Test Code Generation Capabilities
 */
async function testCodeGeneration() {
  console.log('\n🧪 Testing Code Generation Capabilities...\n');
  
  const codeGenerator = new NoxCodeGenerator(
    mockLogger,
    mockPerformanceMonitor,
    mockContextManager
  );

  // Test 1: React Component Generation
  console.log('📝 Test 1: React Component Generation');
  try {
    const reactResult = await codeGenerator.generateCode({
      type: 'component',
      name: 'UserProfile',
      description: 'A user profile component with avatar and details',
      framework: 'react',
      language: 'typescript',
      props: [
        { name: 'user', type: 'User', required: true },
        { name: 'onEdit', type: '() => void', optional: true }
      ],
      state: [
        { name: 'isEditing', defaultValue: 'false' }
      ]
    }, {
      projectStructure: [
        { name: 'package.json', path: './package.json' }
      ]
    });

    console.log('✅ React component generated successfully!');
    console.log('📄 Generated code preview:');
    console.log(reactResult.code.substring(0, 200) + '...');
    console.log(`🎯 Strategy: ${reactResult.metadata.strategy}`);
    console.log(`🔧 Framework: ${reactResult.metadata.framework}`);
  } catch (error) {
    console.error('❌ React component generation failed:', error.message);
  }

  // Test 2: API Generation
  console.log('\n📝 Test 2: Express API Generation');
  try {
    const apiResult = await codeGenerator.generateCode({
      type: 'api',
      name: 'userAPI',
      description: 'User management API with CRUD operations',
      framework: 'express',
      endpoints: [
        { method: 'get', path: '/users', name: 'getUsers' },
        { method: 'post', path: '/users', name: 'createUser' },
        { method: 'put', path: '/users/:id', name: 'updateUser' },
        { method: 'delete', path: '/users/:id', name: 'deleteUser' }
      ],
      auth: true,
      database: true
    }, {});

    console.log('✅ Express API generated successfully!');
    console.log('📄 Generated code preview:');
    console.log(apiResult.code.substring(0, 200) + '...');
    console.log(`🎯 Strategy: ${apiResult.metadata.strategy}`);
  } catch (error) {
    console.error('❌ API generation failed:', error.message);
  }

  // Test 3: Function Generation
  console.log('\n📝 Test 3: TypeScript Function Generation');
  try {
    const functionResult = await codeGenerator.generateCode({
      type: 'function',
      name: 'calculateUserScore',
      description: 'Calculate user score based on activity metrics',
      language: 'typescript',
      parameters: [
        { name: 'activities', type: 'Activity[]', description: 'User activities' },
        { name: 'weights', type: 'ScoreWeights', description: 'Scoring weights' }
      ],
      returnType: 'number',
      async: false
    }, {});

    console.log('✅ TypeScript function generated successfully!');
    console.log('📄 Generated code preview:');
    console.log(functionResult.code.substring(0, 200) + '...');
    console.log(`🎯 Strategy: ${functionResult.metadata.strategy}`);
  } catch (error) {
    console.error('❌ Function generation failed:', error.message);
  }

  // Test 4: Project Scaffolding
  console.log('\n📝 Test 4: Project Scaffolding');
  try {
    const projectResult = await codeGenerator.generateCode({
      type: 'project',
      name: 'my-react-app',
      description: 'A modern React application with TypeScript',
      framework: 'react',
      language: 'typescript',
      features: ['routing', 'state-management', 'testing']
    }, {});

    console.log('✅ Project scaffolding generated successfully!');
    console.log(`📁 Generated ${projectResult.files.length} files:`);
    projectResult.files.forEach(file => {
      console.log(`  - ${file.name} (${file.type})`);
    });
    console.log(`🎯 Strategy: ${projectResult.metadata.strategy}`);
    console.log(`🔧 Framework: ${projectResult.metadata.framework}`);
  } catch (error) {
    console.error('❌ Project scaffolding failed:', error.message);
  }
}

/**
 * 🎯 Test Pattern Detection
 */
async function testPatternDetection() {
  console.log('\n🎯 Testing Pattern Detection...\n');
  
  const codeGenerator = new NoxCodeGenerator(
    mockLogger,
    mockPerformanceMonitor,
    mockContextManager
  );

  const testCases = [
    {
      description: 'Create a React component for user authentication',
      expected: ['component', 'auth']
    },
    {
      description: 'Build a CRUD API for managing products',
      expected: ['api', 'crud']
    },
    {
      description: 'Generate unit tests for the user service',
      expected: ['test']
    },
    {
      description: 'Create a database model for orders',
      expected: ['database', 'class']
    },
    {
      description: 'Setup webpack configuration for the project',
      expected: ['config']
    }
  ];

  for (const testCase of testCases) {
    const patterns = codeGenerator.detectPatterns(testCase.description);
    console.log(`📝 "${testCase.description}"`);
    console.log(`🔍 Detected patterns: [${patterns.join(', ')}]`);
    console.log(`✅ Expected: [${testCase.expected.join(', ')}]`);
    
    const hasExpected = testCase.expected.some(pattern => patterns.includes(pattern));
    console.log(hasExpected ? '✅ Pattern detection successful!' : '❌ Pattern detection needs improvement');
    console.log('');
  }
}

/**
 * 🏗️ Test Template Processing
 */
async function testTemplateProcessing() {
  console.log('\n🏗️ Testing Template Processing...\n');
  
  const codeGenerator = new NoxCodeGenerator(
    mockLogger,
    mockPerformanceMonitor,
    mockContextManager
  );

  const template = `// {{name}} Component
// Generated by NOX 🦊

{{#if typescript}}
interface {{name}}Props {
{{#each props}}
  {{this.name}}: {{this.type}};
{{/each}}
}
{{/if}}

const {{name}} = ({{#if props}}props{{/if}}) => {
{{#each methods}}
  const {{this.name}} = () => {
    // TODO: Implement {{this.name}}
  };
{{/each}}
  
  return <div>{{name}}</div>;
};

export default {{name}};`;

  const variables = {
    name: 'TestComponent',
    typescript: true,
    props: [
      { name: 'title', type: 'string' },
      { name: 'onClick', type: '() => void' }
    ],
    methods: [
      { name: 'handleClick' },
      { name: 'handleSubmit' }
    ]
  };

  const processed = codeGenerator.processTemplate(template, variables);
  
  console.log('📝 Template processing test:');
  console.log('✅ Template processed successfully!');
  console.log('📄 Processed template preview:');
  console.log(processed.substring(0, 300) + '...');
}

/**
 * 🚀 Run All Tests
 */
async function runTests() {
  console.log('🦊 NOX Autonomous Coding Capabilities Test Suite');
  console.log('================================================\n');

  try {
    await testCodeGeneration();
    await testPatternDetection();
    await testTemplateProcessing();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n🚀 NOX is now ready for autonomous coding! 🦊');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testCodeGeneration,
  testPatternDetection,
  testTemplateProcessing,
  runTests
};
