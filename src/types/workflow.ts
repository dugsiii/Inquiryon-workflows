export interface WorkflowStep {
    id: string;
    name: string;
    type: 'agent' | 'human' | 'system';
    config: Record<string, any>;
    dependencies?: string[];
  }
  
  export interface WorkflowDefinition {
    id: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
    metadata?: Record<string, any>;
  }
  
  export interface WorkflowState {
    id: string;
    workflowId: string;
    currentStepId?: string;
    completedSteps: string[];
    stepData: Record<string, any>;
    status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface HumanInput {
    stepId: string;
    prompt: string;
    inputType: 'text' | 'choice' | 'approval' | 'custom';
    options?: string[];
    metadata?: Record<string, any>;
  }
  
  export interface StepResult {
    stepId: string;
    success: boolean;
    data?: any;
    error?: string;
    requiresHuman?: HumanInput;
  }