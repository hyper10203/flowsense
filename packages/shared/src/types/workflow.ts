export interface WorkflowStep {
  id?: number;
  workflow_id?: number;
  step_order: number;
  application: string;
  window_title: string;
  url_pattern?: string | null;
}

export interface Workflow {
  id: number;
  hash: string;
  ai_name?: string | null;
  description?: string | null;
  purpose?: string | null;
  automation_suggestion?: string | null;
  frequency: number;
  confidence: number;
  first_seen: string;
  last_seen: string;
  steps: WorkflowStep[];
}

export interface WorkflowSummary {
  id: number;
  name: string;
  frequency: number;
  confidence: number;
}
