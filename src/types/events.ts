export interface WorkflowEvent {
    id: string;
    workflowId: string;
    type: 'step_started' | 'step_completed' | 'human_input_required' | 'workflow_completed' | 'workflow_failed';
    timestamp: Date;
    data: any;
  }
  
  export type EventHandler = (event: WorkflowEvent) => void | Promise<void>;