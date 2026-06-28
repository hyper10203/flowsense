export type EventType = "window_focus" | "browser_tab" | "terminal" | "idle_resume" | "idle_start";

export interface ActivityEvent {
  id?: number;
  timestamp: string;
  application: string;
  window_title: string;
  url?: string | null;
  command_line?: string | null;
  event_type: EventType;
  duration_ms: number;
  session_id?: string | null;
  created_at?: string;
}

export interface ActivityCreateRequest {
  timestamp: string;
  application: string;
  window_title: string;
  url?: string | null;
  command_line?: string | null;
  event_type: EventType;
  duration_ms: number;
  session_id?: string | null;
}

export interface ActivityListResponse {
  items: ActivityEvent[];
  total: number;
  page: number;
  limit: number;
}
