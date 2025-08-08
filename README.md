# Inquiryon Workflows

A powerful TypeScript framework for building **Human-in-the-Loop (HITL) agentic workflows** with intelligent quality assessment and multi-LLM support.

## 🚀 Features

- **🔄 Human-in-the-Loop Workflows**: Seamlessly integrate human decision points into automated processes
- **🤖 Multi-LLM Support**: Works with OpenAI, Claude (Anthropic), and Google Gemini with automatic fallbacks
- **📊 Intelligent Quality Assessment**: Built-in content quality analysis with customizable assessors
- **⚡ Smart Workflow Engine**: Handles complex step dependencies, state management, and error recovery
- **🔧 Extensible Architecture**: Easy to add custom assessors, workflow steps, and LLM providers
- **💡 Graceful Degradation**: Works perfectly even without LLM providers installed

## 📦 Installation

```bash
npm install inquiryon-workflows
```

### Optional LLM Providers
Install only the LLM providers you want to use:

```bash
# For OpenAI support
npm install openai

# For Claude support  
npm install @anthropic-ai/sdk

# For Gemini support
npm install @google/generative-ai

# For all providers (maximum reliability)
npm install openai @anthropic-ai/sdk @google/generative-ai
```

## 🎯 Quick Start

### Basic Workflow (No AI Required)

```typescript
import { HITLFramework, ConsoleHITL } from 'inquiryon-workflows';

// Create framework with console interface
const framework = new HITLFramework(new ConsoleHITL());

// Define a simple approval workflow
framework.registerWorkflow({
  id: 'content-approval',
  name: 'Content Approval Workflow',
  steps: [
    {
      id: 'create-content',
      name: 'Create Content',
      type: 'system',
      config: {}
    },
    {
      id: 'human-review',
      name: 'Human Review',
      type: 'human',
      config: {
        prompt: 'Please review the content. Approve?',
        inputType: 'choice',
        options: ['approve', 'reject', 'request_changes']
      },
      dependencies: ['create-content']
    },
    {
      id: 'finalize',
      name: 'Finalize Content',
      type: 'system',
      config: {},
      dependencies: ['human-review']
    }
  ]
});

// Start the workflow
const instanceId = await framework.startWorkflow('content-approval');
```

### Quality Assessment

```typescript
import { QualityEngine } from 'inquiryon-workflows';

const engine = new QualityEngine();

const result = await engine.assess({
  text: 'Your content here...',
  subject_line: 'Great Newsletter!',
  type: 'newsletter'
}, {
  enabledAssessors: ['word-count', 'readability', 'grammar'],
  threshold: 7.0
});

console.log(`Quality Score: ${result.overallScore}/10`);
console.log(`Passed: ${result.passed}`);

// Get specific suggestions
result.metrics.forEach(metric => {
  if (metric.suggestions) {
    console.log(`${metric.name}: ${metric.suggestions.join(', ')}`);
  }
});
```

## 🤖 AI-Powered Features

### Multi-LLM Setup

```typescript
import { LLMManager, QualityEngine, EngagementAssessor } from 'inquiryon-workflows';

// Set up environment variables
// OPENAI_API_KEY=your_openai_key
// ANTHROPIC_API_KEY=your_anthropic_key  
// GEMINI_API_KEY=your_gemini_key

// Create LLM manager with fallbacks
const llmManager = await LLMManager.create({
  primaryProvider: 'anthropic',
  fallbackProviders: ['openai', 'gemini'],
  providers: {
    anthropic: { 
      apiKey: process.env.ANTHROPIC_API_KEY!,
      defaultModel: 'claude-3-5-sonnet-20241022'
    },
    openai: { 
      apiKey: process.env.OPENAI_API_KEY!,
      defaultModel: 'gpt-4'
    },
    gemini: { 
      apiKey: process.env.GEMINI_API_KEY!,
      defaultModel: 'gemini-1.5-pro' 
    }
  }
});

// Add AI assessors to quality engine
const engine = new QualityEngine();
engine.registerAssessor(new EngagementAssessor(llmManager));

// AI-powered quality assessment
const result = await engine.assess(content, {
  enabledAssessors: ['engagement', 'grammar', 'readability'],
  assessorConfigs: {
    'engagement': {
      audience: 'tech professionals'
    }
  }
});
```

### Smart Quality Gates

```typescript
import { SmartWorkflowEngine } from 'inquiryon-workflows';

class ContentWorkflow extends SmartWorkflowEngine {
  async executeStep(step, state) {
    if (step.type === 'quality_check') {
      const content = state.stepData['write-content'];
      const qualityResult = await this.qualityEngine.assess(content);
      
      if (qualityResult.passed) {
        return { stepId: step.id, success: true, data: qualityResult };
      } else {
        // Automatically trigger human review for low quality
        return {
          stepId: step.id,
          success: true,
          requiresHuman: {
            stepId: step.id,
            prompt: `Quality score: ${qualityResult.overallScore}/10. Review needed?`,
            inputType: 'choice',
            options: ['approve_anyway', 'request_revision', 'reject'],
            metadata: {
              qualityDetails: qualityResult.metrics,
              suggestions: qualityResult.metrics.flatMap(m => m.suggestions || [])
            }
          }
        };
      }
    }
    
    return super.executeStep(step, state);
  }
}
```

## 📊 Built-in Quality Assessors

### Basic Assessors (Always Available)
- **Word Count**: Validates appropriate content length
- **Readability**: Analyzes text complexity (Flesch reading ease)
- **Grammar**: Detects basic grammar and style issues

### AI Assessors (Require LLM Provider)
- **Engagement**: Predicts audience engagement potential
- **Brand Voice**: Ensures consistency with brand guidelines
- **Overall Quality**: Comprehensive content quality analysis

### Domain-Specific Assessors
- **Newsletter Structure**: Validates newsletter completeness
- **SEO Optimization**: Checks keyword density and structure

### Usage Example

```typescript
const engine = new QualityEngine();

// Newsletter-optimized assessment
const result = await engine.assess({
  text: 'Newsletter content...',
  subject_line: 'Weekly Update',
  type: 'newsletter'
}, QualityEngine.newsletterConfig());

// Custom assessment
const customResult = await engine.assess(content, {
  threshold: 8.0,
  enabledAssessors: ['word-count', 'engagement', 'brand-voice'],
  weights: {
    'engagement': 0.5,
    'brand-voice': 0.3,
    'word-count': 0.2
  },
  assessorConfigs: {
    'brand-voice': {
      brandGuidelines: 'Professional, friendly, tech-focused. Avoid jargon.'
    },
    'word-count': {
      minWords: 300,
      maxWords: 1200
    }
  }
});
```

## 🔄 Workflow Examples

### Newsletter Creation Workflow

```typescript
const newsletterWorkflow = {
  id: 'ai-newsletter',
  name: 'AI-Powered Newsletter Creation',
  steps: [
    {
      id: 'research-content',
      name: 'Research Trending Topics',
      type: 'agent',
      config: {
        agentType: 'content_researcher',
        industry: 'technology',
        topics: ['AI', 'startups', 'funding']
      }
    },
    {
      id: 'write-content',
      name: 'Generate Newsletter',
      type: 'agent',
      config: {
        agentType: 'content_writer',
        tone: 'professional',
        target_length: 800
      },
      dependencies: ['research-content']
    },
    {
      id: 'quality-check',
      name: 'Quality Assessment',
      type: 'smart_system',
      config: {
        taskType: 'quality_validator',
        threshold: 7.5
      },
      dependencies: ['write-content']
    },
    {
      id: 'human-approval',
      name: 'Final Approval',
      type: 'human',
      config: {
        prompt: 'Ready to send newsletter to subscribers?',
        inputType: 'approval'
      },
      dependencies: ['quality-check']
    },
    {
      id: 'send-newsletter',
      name: 'Send Newsletter',
      type: 'agent',
      config: { agentType: 'email_sender' },
      dependencies: ['human-approval']
    }
  ]
};
```

### Expense Approval with Smart Rules

```typescript
const expenseWorkflow = {
  id: 'smart-expense-approval',
  name: 'Smart Expense Approval',
  steps: [
    {
      id: 'submit-expense',
      name: 'Submit Expense',
      type: 'system',
      config: {}
    },
    {
      id: 'smart-approval',
      name: 'Smart Approval Check',
      type: 'smart_system',
      config: {
        taskType: 'expense_check',
        // Auto-approves < $100, requires human approval for larger amounts
      },
      dependencies: ['submit-expense']
    },
    {
      id: 'process-expense',
      name: 'Process Approved Expense',
      type: 'system',
      config: {},
      dependencies: ['smart-approval']
    }
  ]
};
```

## 🛠️ Configuration

### Environment Variables

```bash
# LLM Provider API Keys (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...

# Quality Assessment Thresholds
DEFAULT_QUALITY_THRESHOLD=7.0
NEWSLETTER_QUALITY_THRESHOLD=7.5
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext", 
    "moduleResolution": "node",
    "strict": true,
    "downlevelIteration": true
  }
}
```

## 🔧 Extending the Framework

### Custom Quality Assessor

```typescript
import { BaseAssessor } from 'inquiryon-workflows';

export class SEOAssessor extends BaseAssessor {
  readonly name = 'seo';
  readonly category = 'external';
  readonly defaultWeight = 0.2;

  async assess(content, config = {}) {
    const keywords = config.keywords || [];
    let score = 10;
    const suggestions = [];

    // Check keyword density
    const keywordDensity = this.calculateKeywordDensity(content.text, keywords);
    if (keywordDensity < 0.005) {
      score -= 2;
      suggestions.push('Include more target keywords');
    }

    return this.createMetric(score, `SEO analysis completed`, suggestions);
  }

  private calculateKeywordDensity(text, keywords) {
    // Implementation...
  }
}

// Register the assessor
engine.registerAssessor(new SEOAssessor());
```

### Custom LLM Provider

```typescript
import { BaseLLMProvider } from 'inquiryon-workflows';

export class CustomLLMProvider extends BaseLLMProvider {
  readonly name = 'custom';
  readonly supportedModels = ['custom-model-v1'];

  async chat(messages, options) {
    // Your custom LLM implementation
    return {
      content: 'Response from custom LLM',
      provider: this.name,
      model: 'custom-model-v1'
    };
  }
}

// Register the provider
LLMProviderFactory.registerProvider('custom', CustomLLMProvider);
```

## 📚 API Reference

### Core Classes

- **`HITLFramework`**: Main framework orchestrator
- **`WorkflowEngine`**: Handles workflow execution and state
- **`QualityEngine`**: Manages content quality assessment
- **`LLMManager`**: Multi-provider LLM management with fallbacks

### Quality Assessment

- **`BaseAssessor`**: Abstract base class for quality assessors
- **Basic Assessors**: `WordCountAssessor`, `ReadabilityAssessor`, `GrammarAssessor`
- **AI Assessors**: `EngagementAssessor`, `BrandVoiceAssessor`, `OverallQualityAssessor`

### LLM Providers

- **`BaseLLMProvider`**: Abstract base for LLM providers
- **Providers**: `OpenAIProvider`, `AnthropicProvider`, `GeminiProvider`
- **`LLMProviderFactory`**: Creates and manages provider instances

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/inquiryon/inquiryon-workflows
cd inquiryon-workflows
npm install
npm run build
npm run test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Coming Soon]()
- **Issues**: [GitHub Issues](https://github.com/inquiryon/inquiryon-workflows/issues)
- **Discussions**: [GitHub Discussions](https://github.com/inquiryon/inquiryon-workflows/discussions)

---

Built with ❤️ by [Inquiryon](https://inquiryon.com)