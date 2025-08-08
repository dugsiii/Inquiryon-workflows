import { LLMProviderFactory, LLMManager } from '../quality/llm/index.js';
import { QualityEngine } from '../quality/QualityEngine.js';
import { EngagementAssessor, BrandVoiceAssessor } from '../quality/assessors/ai/index.js';
import 'dotenv/config'; 

async function testLLMSystem() {
  console.log('🧪 Testing LLM System...\n');

  // Test 1: Check which providers are available
  console.log('📦 Step 1: Checking available LLM providers...');
  try {
    const availableProviders = await LLMProviderFactory.getAvailableProvidersAsync();
    console.log(`✅ Available providers: ${availableProviders.join(', ') || 'none'}`);
    
    if (availableProviders.length === 0) {
      console.log('💡 No LLM providers available. To test AI features, install:');
      console.log('   npm install openai              # For OpenAI');
      console.log('   npm install @anthropic-ai/sdk   # For Claude');
      console.log('   npm install @google/generative-ai # For Gemini');
      console.log('\n✅ Basic quality assessment will still work without LLM providers!\n');
    }

    // Test 2: Basic Quality Engine (works without LLM)
    console.log('📊 Step 2: Testing basic quality assessment...');
    const engine = new QualityEngine();
    
    const testContent = {
      text: 'This is a test newsletter content. It has some interesting information about technology trends. We hope you find it engaging and informative.',
      subject_line: 'Weekly Tech Update',
      type: 'newsletter' as const
    };

    const basicResult = await engine.assess(testContent, {
      enabledAssessors: ['word-count', 'readability', 'grammar'],
      threshold: 6.0
    });

    console.log(`✅ Basic quality score: ${basicResult.overallScore}/10`);
    console.log(`✅ Assessment passed: ${basicResult.passed}`);
    console.log(`✅ Metrics evaluated: ${basicResult.metrics.length}`);

    // Test 3: LLM Manager (only if providers available)
    if (availableProviders.length > 0) {
      console.log('\n🤖 Step 3: Testing LLM Manager...');
      
      try {
        // Create LLM manager with available providers
        const llmConfig = {
          primaryProvider: availableProviders[0],
          fallbackProviders: availableProviders.slice(1),
          providers: {} as any
        };

        // Add API keys for available providers
        for (const provider of availableProviders) {
          const apiKeyVar = `${provider.toUpperCase()}_API_KEY`;
          const apiKey = process.env[apiKeyVar];
          
          if (apiKey) {
            llmConfig.providers[provider] = { 
              apiKey,
              defaultOptions: {
                maxTokens: 100, // Keep it small for testing
                temperature: 0.1
              }
            };
            console.log(`✅ Found API key for ${provider}`);
          } else {
            console.log(`⚠️ No API key found for ${provider} (${apiKeyVar})`);
          }
        }

        // Only proceed if we have at least one API key
        const providersWithKeys = Object.keys(llmConfig.providers);
        if (providersWithKeys.length > 0) {
          const llmManager = await LLMManager.create(llmConfig);
          console.log(`✅ LLM Manager initialized with: ${llmManager.getAvailableProviders().join(', ')}`);

          // Test 4: Health check
          console.log('\n🔍 Step 4: Checking LLM provider health...');
          const health = await llmManager.checkHealth();
          console.log('Health status:', health);

          // Test 5: Simple LLM call
          console.log('\n💬 Step 5: Testing simple LLM call...');
          try {
            const response = await llmManager.prompt('Rate this on a scale of 1-10: "Hello world"', {
              maxTokens: 50,
              temperature: 0.1
            });
            console.log(`✅ LLM Response: ${response.content.substring(0, 100)}...`);
            console.log(`✅ Used provider: ${response.provider} (${response.model})`);
            console.log(`✅ Token usage: ${response.usage?.totalTokens || 'unknown'}`);
          } catch (error) {
            console.log(`❌ LLM call failed: ${error}`);
          }

          // Test 6: AI Quality Assessment
          console.log('\n🎯 Step 6: Testing AI quality assessment...');
          try {
            // Register AI assessors
            engine.registerAssessor(new EngagementAssessor(llmManager));
            
            const aiResult = await engine.assess(testContent, {
              enabledAssessors: ['word-count', 'grammar', 'engagement'],
              threshold: 6.0,
              assessorConfigs: {
                'engagement': {
                  audience: 'tech professionals'
                }
              }
            });

            console.log(`✅ AI-enhanced quality score: ${aiResult.overallScore}/10`);
            console.log(`✅ AI assessment passed: ${aiResult.passed}`);
            console.log(`✅ AI metrics: ${aiResult.metrics.filter(m => m.category === 'ai').length}`);
            
            // Show AI-specific results
            const aiMetrics = aiResult.metrics.filter(m => m.category === 'ai');
            aiMetrics.forEach(metric => {
              console.log(`   - ${metric.name}: ${metric.score}/10 - ${metric.details}`);
            });
            
          } catch (error) {
            console.log(`❌ AI assessment failed: ${error}`);
          }

        } else {
          console.log('⚠️ No API keys configured. Skipping LLM tests.');
          console.log('💡 Set environment variables:');
          console.log('   export OPENAI_API_KEY=your_key_here');
          console.log('   export ANTHROPIC_API_KEY=your_key_here');
          console.log('   export GEMINI_API_KEY=your_key_here');
        }

      } catch (error) {
        console.log(`❌ LLM Manager initialization failed: ${error}`);
      }
    }

    // Test 7: Error handling
    console.log('\n🛡️ Step 7: Testing error handling...');
    try {
      // Test with unavailable provider
      await LLMProviderFactory.createProvider('openai' as any, { apiKey: 'test' });
      console.log('❌ Should have thrown error for unavailable provider');
    } catch (error) {
      console.log('✅ Properly handled unavailable provider error');
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test workflow integration
async function testWorkflowIntegration() {
  console.log('\n🔄 Testing Workflow Integration...\n');

  try {
    // Test: Smart quality engine initialization
    const availableProviders = await LLMProviderFactory.getAvailableProvidersAsync();
    
    if (availableProviders.length > 0) {
      console.log('🚀 Initializing AI-powered quality engine...');
      
      // Create LLM manager
      const llmManager = await LLMManager.create({
        primaryProvider: availableProviders[0],
        providers: {
          [availableProviders[0]]: {
            apiKey: process.env[`${availableProviders[0].toUpperCase()}_API_KEY`] || 'test-key'
          }
        }
      });

      // Create quality engine with AI assessors
      const engine = new QualityEngine();
      engine.registerAssessor(new EngagementAssessor(llmManager));
      engine.registerAssessor(new BrandVoiceAssessor(llmManager));

      // Test content that should trigger human review
      const lowQualityContent = {
        text: 'Bad content. Very short. No value.',
        subject_line: 'Hi',
        type: 'newsletter' as const
      };

      const result = await engine.assess(lowQualityContent, {
        threshold: 7.0,
        enabledAssessors: ['word-count', 'engagement'],
        assessorConfigs: {
          'engagement': { audience: 'professionals' }
        }
      });

      console.log(`Quality Score: ${result.overallScore}/10`);
      console.log(`Should trigger human review: ${!result.passed}`);
      
      if (!result.passed) {
        console.log('✅ Correctly identified low-quality content for human review');
        console.log('Suggestions:');
        result.metrics.forEach(metric => {
          if (metric.suggestions && metric.suggestions.length > 0) {
            metric.suggestions.forEach(suggestion => {
              console.log(`  - ${suggestion}`);
            });
          }
        });
      }

    } else {
      console.log('📦 Basic workflow testing (no AI)...');
      
      const engine = new QualityEngine();
      const result = await engine.assess({
        text: 'This is a basic test of the quality system without AI features.',
        type: 'newsletter'
      });
      
      console.log(`✅ Basic quality score: ${result.overallScore}/10`);
    }

  } catch (error) {
    console.error('❌ Workflow integration test failed:', error);
  }
}

// Helper function to test individual providers
async function testIndividualProvider(providerType: 'openai' | 'anthropic' | 'gemini') {
  console.log(`\n🔍 Testing ${providerType} provider individually...`);
  
  try {
    const apiKeyVar = `${providerType.toUpperCase()}_API_KEY`;
    const apiKey = process.env[apiKeyVar];
    
    if (!apiKey) {
      console.log(`⚠️ No API key found for ${providerType} (${apiKeyVar})`);
      return;
    }

    const provider = await LLMProviderFactory.createProvider(providerType, {
      apiKey,
      defaultOptions: { maxTokens: 50, temperature: 0.1 }
    });

    console.log(`✅ ${providerType} provider created`);
    
    // Test health
    const isHealthy = await provider.isHealthy();
    console.log(`Health check: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    
    if (isHealthy) {
      // Test simple call
      const response = await provider.prompt('Say hello in exactly 3 words.');
      console.log(`Response: "${response.content}"`);
      console.log(`Model: ${response.model}`);
      console.log(`Tokens: ${response.usage?.totalTokens || 'unknown'}`);
    }

  } catch (error) {
    console.log(`❌ ${providerType} test failed: ${error}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🔬 LLM System Comprehensive Test Suite');
  console.log('=====================================\n');

  // Core system tests
  await testLLMSystem();
  
  // Workflow integration tests
  await testWorkflowIntegration();
  
  // Individual provider tests (if API keys available)
  console.log('\n🔧 Individual Provider Tests');
  console.log('=============================');
  
  await testIndividualProvider('openai');
  await testIndividualProvider('anthropic');
  await testIndividualProvider('gemini');
  
  console.log('\n✨ Test suite completed!');
  console.log('\n💡 To enable all features, set environment variables:');
  console.log('   export OPENAI_API_KEY=your_openai_key');
  console.log('   export ANTHROPIC_API_KEY=your_anthropic_key');
  console.log('   export GEMINI_API_KEY=your_gemini_key');
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests().catch(console.error);
} else if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('test-llm-system.ts')) {
  runAllTests().catch(console.error);
}

export { runAllTests, testLLMSystem, testWorkflowIntegration, testIndividualProvider };