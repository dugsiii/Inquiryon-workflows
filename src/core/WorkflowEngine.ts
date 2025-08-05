import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowStep, WorkflowDefinition, WorkflowState, StepResult, HumanInput } from '../types/workflow.js';
import { WorkflowEvent } from '../types/events.js';

export class WorkflowEngine extends EventEmitter {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private states: Map<string, WorkflowState> = new Map();
  private pendingHumanInputs: Map<string, HumanInput> = new Map();

  // Register a workflow definition
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
  }

  // Start a new workflow instance
  async startWorkflow(workflowId: string, initialData?: Record<string, any>): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const instanceId = uuidv4();
    const state: WorkflowState = {
      id: instanceId,
      workflowId,
      completedSteps: [],
      stepData: initialData || {},
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.states.set(instanceId, state);
    
    // Start execution
    await this.executeNextStep(instanceId);
    
    return instanceId;
  }

  // Execute the next available step
  private async executeNextStep(instanceId: string): Promise<void> {
    const state = this.states.get(instanceId);
    const workflow = state ? this.workflows.get(state.workflowId) : undefined;
    
    if (!state || !workflow) return;

    // Find next step to execute
    const nextStep = this.findNextStep(workflow, state);
    if (!nextStep) {
      // Workflow complete
      state.status = 'completed';
      state.updatedAt = new Date();
      this.emitEvent(instanceId, 'workflow_completed', { state });
      return;
    }

    state.currentStepId = nextStep.id;
    state.status = 'running';
    state.updatedAt = new Date();

    this.emitEvent(instanceId, 'step_started', { stepId: nextStep.id, step: nextStep });

    try {
      const result = await this.executeStep(nextStep, state);
      
      if (result.requiresHuman) {
        // Pause for human input
        state.status = 'paused';
        state.updatedAt = new Date();
        this.pendingHumanInputs.set(instanceId, result.requiresHuman);
        this.emitEvent(instanceId, 'human_input_required', { 
          humanInput: result.requiresHuman,
          state 
        });
      } else if (result.success) {
        // Step completed successfully
        state.completedSteps.push(nextStep.id);
        if (result.data) {
          state.stepData[nextStep.id] = result.data;
        }
        state.updatedAt = new Date();
        
        this.emitEvent(instanceId, 'step_completed', { 
          stepId: nextStep.id, 
          result: result.data 
        });
        
        // Continue to next step
        await this.executeNextStep(instanceId);
      } else {
        // Step failed
        state.status = 'failed';
        state.updatedAt = new Date();
        this.emitEvent(instanceId, 'workflow_failed', { 
          stepId: nextStep.id, 
          error: result.error 
        });
      }
    } catch (error) {
      state.status = 'failed';
      state.updatedAt = new Date();
      this.emitEvent(instanceId, 'workflow_failed', { 
        stepId: nextStep.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  // Provide human input and resume workflow
  async provideHumanInput(instanceId: string, input: any): Promise<void> {
    const state = this.states.get(instanceId);
    const pendingInput = this.pendingHumanInputs.get(instanceId);
    
    if (!state || !pendingInput || state.status !== 'paused') {
      throw new Error('No pending human input for this workflow');
    }

    // Store human input
    state.stepData[pendingInput.stepId] = {
      ...state.stepData[pendingInput.stepId],
      humanInput: input
    };

    // Mark step as completed
    state.completedSteps.push(pendingInput.stepId);
    state.status = 'running';
    state.updatedAt = new Date();
    
    // Clear pending input
    this.pendingHumanInputs.delete(instanceId);
    
    this.emitEvent(instanceId, 'step_completed', { 
      stepId: pendingInput.stepId, 
      result: input 
    });

    // Continue workflow
    await this.executeNextStep(instanceId);
  }

  // Find the next step that can be executed
  private findNextStep(workflow: WorkflowDefinition, state: WorkflowState) {
    return workflow.steps.find(step => {
      // Skip completed steps
      if (state.completedSteps.includes(step.id)) return false;
      
      // Check if dependencies are met
      if (step.dependencies) {
        return step.dependencies.every(dep => state.completedSteps.includes(dep));
      }
      
      return true;
    });
  }

  // Execute a single step (override in subclasses for custom step types)
  protected async executeStep(step: WorkflowStep, state: WorkflowState): Promise<StepResult> {
    switch (step.type) {
      case 'human':
        return {
          stepId: step.id,
          success: true,
          requiresHuman: {
            stepId: step.id,
            prompt: step.config.prompt || `Input required for step: ${step.name}`,
            inputType: step.config.inputType || 'text',
            options: step.config.options,
            metadata: step.config.metadata
          }
        };
      
      case 'system':
        // Simple system step - just return success
        return {
          stepId: step.id,
          success: true,
          data: { message: `System step ${step.name} completed` }
        };
      
      case 'agent':
        // Placeholder for agent execution - override this method
        return {
          stepId: step.id,
          success: true,
          data: { message: `Agent step ${step.name} completed` }
        };
      
      default:
        return {
          stepId: step.id,
          success: false,
          error: `Unknown step type: ${step.type}`
        };
    }
  }

  // Get workflow state
  getWorkflowState(instanceId: string): WorkflowState | undefined {
    return this.states.get(instanceId);
  }

  // Get pending human input
  getPendingHumanInput(instanceId: string): HumanInput | undefined {
    return this.pendingHumanInputs.get(instanceId);
  }

  // Emit workflow events
  private emitEvent(workflowId: string, type: WorkflowEvent['type'], data: any): void {
    const event: WorkflowEvent = {
      id: uuidv4(),
      workflowId,
      type,
      timestamp: new Date(),
      data
    };
    
    this.emit('workflow_event', event);
    this.emit(type, event);
  }
}