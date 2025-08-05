import { HITLFramework } from '../index.js';
import { ConsoleHITL } from '../interfaces/HITLInterface.js';
import { WorkflowDefinition } from '../types/workflow.js';

// Create framework with console HITL interface
const hitlInterface = new ConsoleHITL();
const framework = new HITLFramework(hitlInterface);

// Define a simple workflow
const simpleWorkflow: WorkflowDefinition = {
  id: 'simple-approval',
  name: 'Simple Approval Workflow',
  description: 'A basic workflow that requires human approval',
  steps: [
    {
      id: 'collect-info',
      name: 'Collect Information',
      type: 'system',
      config: {}
    },
    {
      id: 'human-review',
      name: 'Human Review',
      type: 'human',
      config: {
        prompt: 'Please review the collected information. Do you approve? (yes/no)',
        inputType: 'choice',
        options: ['yes', 'no']
      },
      dependencies: ['collect-info']
    },
    {
      id: 'final-step',
      name: 'Process Result',
      type: 'system',
      config: {},
      dependencies: ['human-review']
    }
  ]
};

// Register and start workflow
async function runExample() {
  framework.registerWorkflow(simpleWorkflow);
  
  console.log('Starting workflow...');
  const instanceId = await framework.startWorkflow('simple-approval', {
    requestData: 'Sample data for review'
  });
  
  console.log(`Workflow started with ID: ${instanceId}`);
}

runExample().catch(console.error);