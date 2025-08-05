import { WorkflowEngine } from './WorkflowEngine.js';
import { HITLInterface } from '../interfaces/HITLInterface.js';
import { WorkflowDefinition } from '../types/workflow.js';

export class HITLFramework {
  private engine: WorkflowEngine;
  private hitlInterface?: HITLInterface;

  constructor(hitlInterface?: HITLInterface) {
    this.engine = new WorkflowEngine();
    this.hitlInterface = hitlInterface;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.engine.on('human_input_required', async (event) => {
      if (this.hitlInterface) {
        await this.hitlInterface.requestInput(event.workflowId, event.data.humanInput);
      }
    });

    this.engine.on('workflow_completed', async (event) => {
      if (this.hitlInterface) {
        await this.hitlInterface.notifyWorkflowComplete(event.workflowId, event.data.state);
      }
    });

    this.engine.on('workflow_failed', async (event) => {
      if (this.hitlInterface) {
        await this.hitlInterface.notifyWorkflowError(event.workflowId, event.data.error);
      }
    });

    // Handle human input from HITL interface
    if (this.hitlInterface) {
      this.hitlInterface.on('human_input', async (workflowId: string, input: any) => {
        await this.engine.provideHumanInput(workflowId, input);
      });
    }
  }

  // Framework API methods
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.engine.registerWorkflow(workflow);
  }

  async startWorkflow(workflowId: string, initialData?: Record<string, any>): Promise<string> {
    return await this.engine.startWorkflow(workflowId, initialData);
  }

  async provideInput(instanceId: string, input: any): Promise<void> {
    return await this.engine.provideHumanInput(instanceId, input);
  }

  getWorkflowState(instanceId: string) {
    return this.engine.getWorkflowState(instanceId);
  }

  getPendingInput(instanceId: string) {
    return this.engine.getPendingHumanInput(instanceId);
  }

  // Event subscription
  on(event: string, listener: (...args: any[]) => void): void {
    this.engine.on(event, listener);
  }
}