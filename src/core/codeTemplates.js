/**
 * 🦊 NOX Code Templates
 * Enterprise-grade code templates for intelligent generation
 */

/**
 * 🎨 React Component Templates
 */
function getReactComponentTemplate() {
  return `import React{{#if typescript}}, { FC }{{/if}} from 'react';
{{#if styling}}
import './{{componentName}}.css';
{{/if}}

{{#if typescript}}
interface {{componentName}}Props {
{{#each props}}
  {{this.name}}{{#if this.optional}}?{{/if}}: {{this.type}};
{{/each}}
}

const {{componentName}}: FC<{{componentName}}Props> = ({{#if props}}{ {{#each props}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}} }{{/if}}) => {
{{else}}
const {{componentName}} = ({{#if props}}{ {{#each props}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}} }{{/if}}) => {
{{/if}}
{{#each state}}
  const [{{this.name}}, set{{this.name}}] = React.useState({{this.defaultValue}});
{{/each}}

{{#each methods}}
  const {{this.name}} = {{#if this.async}}async {{/if}}({{#each this.params}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}) => {
    // TODO: Implement {{this.name}}
  };

{{/each}}
  return (
    <div className="{{componentName}}">
      <h2>{{componentName}}</h2>
      {/* TODO: Add component content */}
    </div>
  );
};

export default {{componentName}};
`;
}

/**
 * 🎯 Vue Component Template
 */
function getVueComponentTemplate() {
  return `<template>
  <div class="{{componentName}}">
    <h2>{{componentName}}</h2>
    <!-- TODO: Add component content -->
  </div>
</template>

<script{{#if typescript}} lang="ts"{{/if}}>
{{#if typescript}}
import { defineComponent } from 'vue';

export default defineComponent({
  name: '{{componentName}}',
{{#if props}}
  props: {
{{#each props}}
    {{this.name}}: {
      type: {{this.type}},
      {{#if this.required}}required: true{{else}}default: {{this.default}}{{/if}}
    }{{#unless @last}},{{/unless}}
{{/each}}
  },
{{/if}}
  setup({{#if props}}props{{/if}}) {
{{#each state}}
    const {{this.name}} = ref({{this.defaultValue}});
{{/each}}

{{#each methods}}
    const {{this.name}} = {{#if this.async}}async {{/if}}({{#each this.params}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}) => {
      // TODO: Implement {{this.name}}
    };

{{/each}}
    return {
{{#each state}}
      {{this.name}},
{{/each}}
{{#each methods}}
      {{this.name}},
{{/each}}
    };
  }
});
{{else}}
export default {
  name: '{{componentName}}',
{{#if props}}
  props: {
{{#each props}}
    {{this.name}}: {
      type: {{this.type}},
      {{#if this.required}}required: true{{else}}default: {{this.default}}{{/if}}
    }{{#unless @last}},{{/unless}}
{{/each}}
  },
{{/if}}
  data() {
    return {
{{#each state}}
      {{this.name}}: {{this.defaultValue}}{{#unless @last}},{{/unless}}
{{/each}}
    };
  },
  methods: {
{{#each methods}}
    {{#if this.async}}async {{/if}}{{this.name}}({{#each this.params}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}) {
      // TODO: Implement {{this.name}}
    }{{#unless @last}},{{/unless}}
{{/each}}
  }
};
{{/if}}
</script>

<style scoped>
.{{componentName}} {
  /* TODO: Add component styles */
}
</style>
`;
}

/**
 * ⚡ JavaScript Function Template
 */
function getJavaScriptFunctionTemplate() {
  return `/**
 * {{description}}
{{#each parameters}}
 * @param {*} {{this.name}} - {{this.description}}
{{/each}}
 * @returns {*} {{returnType}}
 */
{{#if async}}async {{/if}}function {{functionName}}({{#each parameters}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}) {
  // TODO: Implement {{functionName}}
{{#if async}}
  try {
    // Async implementation here
    return null;
  } catch (error) {
    console.error('Error in {{functionName}}:', error);
    throw error;
  }
{{else}}
  return null;
{{/if}}
}

module.exports = {{functionName}};
`;
}

/**
 * 🔷 TypeScript Function Template
 */
function getTypeScriptFunctionTemplate() {
  return `/**
 * {{description}}
{{#each parameters}}
 * @param {{this.name}} - {{this.description}}
{{/each}}
 * @returns {{returnType}}
 */
{{#if async}}async {{/if}}function {{functionName}}(
{{#each parameters}}
  {{this.name}}: {{this.type}}{{#unless @last}},{{/unless}}
{{/each}}
): {{#if async}}Promise<{{returnType}}>{{else}}{{returnType}}{{/if}} {
  // TODO: Implement {{functionName}}
{{#if async}}
  try {
    // Async implementation here
    return null as any;
  } catch (error) {
    console.error('Error in {{functionName}}:', error);
    throw error;
  }
{{else}}
  return null as any;
{{/if}}
}

export default {{functionName}};
`;
}

/**
 * 🏗️ JavaScript Class Template
 */
function getJavaScriptClassTemplate() {
  return `/**
 * {{className}} class
 */
class {{className}}{{#if extends}} extends {{extends}}{{/if}} {
  /**
   * Constructor for {{className}}
{{#each constructor.params}}
   * @param {*} {{this.name}} - {{this.description}}
{{/each}}
   */
  constructor({{#each constructor.params}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}) {
{{#if extends}}
    super({{#each constructor.superParams}}{{this}}{{#unless @last}}, {{/unless}}{{/each}});
{{/if}}
{{#each properties}}
    this.{{this.name}} = {{this.defaultValue}};
{{/each}}
  }

{{#each methods}}
  /**
   * {{this.description}}
{{#each this.params}}
   * @param {*} {{this.name}} - {{this.description}}
{{/each}}
   * @returns {*} {{this.returnType}}
   */
  {{#if this.async}}async {{/if}}{{this.name}}({{#each this.params}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}) {
    // TODO: Implement {{this.name}}
{{#if this.async}}
    try {
      // Async implementation here
      return null;
    } catch (error) {
      console.error('Error in {{this.name}}:', error);
      throw error;
    }
{{else}}
    return null;
{{/if}}
  }

{{/each}}
}

module.exports = {{className}};
`;
}

/**
 * 🔷 TypeScript Class Template
 */
function getTypeScriptClassTemplate() {
  return `{{#each implements}}
import { {{this}} } from './interfaces';
{{/each}}

/**
 * {{className}} class
 */
export class {{className}}{{#if extends}} extends {{extends}}{{/if}}{{#if implements}} implements {{#each implements}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}} {
{{#each properties}}
  {{#if this.access}}{{this.access}} {{/if}}{{this.name}}: {{this.type}}{{#if this.defaultValue}} = {{this.defaultValue}}{{/if}};
{{/each}}

  /**
   * Constructor for {{className}}
{{#each constructor.params}}
   * @param {{this.name}} - {{this.description}}
{{/each}}
   */
  constructor({{#each constructor.params}}{{this.name}}: {{this.type}}{{#unless @last}}, {{/unless}}{{/each}}) {
{{#if extends}}
    super({{#each constructor.superParams}}{{this}}{{#unless @last}}, {{/unless}}{{/each}});
{{/if}}
{{#each properties}}
    {{#unless this.defaultValue}}this.{{this.name}} = {{this.name}};{{/unless}}
{{/each}}
  }

{{#each methods}}
  /**
   * {{this.description}}
{{#each this.params}}
   * @param {{this.name}} - {{this.description}}
{{/each}}
   * @returns {{this.returnType}}
   */
  {{#if this.access}}{{this.access}} {{/if}}{{#if this.async}}async {{/if}}{{this.name}}(
{{#each this.params}}
    {{this.name}}: {{this.type}}{{#unless @last}},{{/unless}}
{{/each}}
  ): {{#if this.async}}Promise<{{this.returnType}}>{{else}}{{this.returnType}}{{/if}} {
    // TODO: Implement {{this.name}}
{{#if this.async}}
    try {
      // Async implementation here
      return null as any;
    } catch (error) {
      console.error('Error in {{this.name}}:', error);
      throw error;
    }
{{else}}
    return null as any;
{{/if}}
  }

{{/each}}
}
`;
}

/**
 * 🌐 Express API Template
 */
function getExpressAPITemplate() {
  return `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
{{#if database}}
const db = require('./database');
{{/if}}
{{#if auth}}
const auth = require('./middleware/auth');
{{/if}}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

{{#each middleware}}
app.use({{this}});
{{/each}}

// Routes
{{#each endpoints}}
app.{{this.method}}('{{this.path}}'{{#if ../auth}}, auth{{/if}}, {{#if this.async}}async {{/if}}(req, res) => {
  try {
    // TODO: Implement {{this.path}} {{this.method}} endpoint
    res.json({ message: '{{this.path}} endpoint' });
  } catch (error) {
    console.error('Error in {{this.path}}:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

{{/each}}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 {{apiName}} server running on port \${PORT}\`);
});

module.exports = app;
`;
}

module.exports = {
  getReactComponentTemplate,
  getVueComponentTemplate,
  getJavaScriptFunctionTemplate,
  getTypeScriptFunctionTemplate,
  getJavaScriptClassTemplate,
  getTypeScriptClassTemplate,
  getExpressAPITemplate,
};
