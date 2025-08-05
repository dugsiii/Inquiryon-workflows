import { EventEmitter } from 'events';
import { HumanInput } from '../types/workflow.js';

export abstract class HITLInterface extends EventEmitter {
  abstract requestInput(workflowId: string, input: HumanInput): Promise<void>;
  abstract notifyWorkflowComplete(workflowId: string, result: any): Promise<void>;
  abstract notifyWorkflowError(workflowId: string, error: string): Promise<void>;
}

// Console-based HITL implementation for development
export class ConsoleHITL extends HITLInterface {
  private readline: any;

  constructor() {
    super();
    // Dynamic import for readline
    import('readline').then(rl => {
      this.readline = rl;
    });
  }

  async requestInput(workflowId: string, input: HumanInput): Promise<void> {
    console.log(`\n🤖 Workflow ${workflowId} needs human input:`);
    console.log(`📝 ${input.prompt}`);
    
    if (input.options) {
      console.log('Options:', input.options.join(', '));
    }

    if (this.readline) {
      const rl = this.readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('Your input: ', (answer: string) => {
        rl.close();
        this.emit('human_input', workflowId, answer);
      });
    }
  }

  async notifyWorkflowComplete(workflowId: string, result: any): Promise<void> {
    console.log(`\n✅ Workflow ${workflowId} completed!`);
    console.log('Result:', result);
  }

  async notifyWorkflowError(workflowId: string, error: string): Promise<void> {
    console.log(`\n❌ Workflow ${workflowId} failed: ${error}`);
  }
}