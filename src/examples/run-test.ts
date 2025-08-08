import { runAllTests } from './test-llm-system.js';

// Simple test runner that doesn't use import.meta
async function main() {
  console.log('🚀 Starting LLM System Tests...\n');
  
  try {
    await runAllTests();
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  }
}

main();