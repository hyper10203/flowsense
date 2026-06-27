export type SuggestionStatus = "pending" | "accepted" | "dismissed";

export interface Suggestion {
  id: number;
  workflow_id: number;
  status: SuggestionStatus;
  shown_at: string;
  action_at?: string | null;
  workflow?: {
    id: number;
    ai_name?: string | null;
    frequency: number;
    confidence: number;
    description?: string | null;
    automation_suggestion?: string | null;
  };
}
