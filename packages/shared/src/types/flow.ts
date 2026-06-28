import type { WorkflowStep } from "./workflow.js";

export interface FlowSession {
  id: number;
  workflow_id: number;
  status: "active" | "completed" | "abandoned";
  steps_completed: number;
  started_at: string;
  ended_at?: string | null;
  duration_seconds?: number;
  workflow_name?: string | null;
}

export interface ActiveFlowSession {
  id: number;
  workflow_id: number;
  status: string;
  steps_completed: number;
  started_at: string;
  workflow: {
    id: number;
    ai_name: string | null;
    steps: WorkflowStep[];
  } | null;
}
