import type {
  ActivityEvent,
  ActivityListResponse,
  AnalyticsSummary,
  AppUsagePoint,
  DailyTrendPoint,
  Suggestion,
  Workflow,
} from "@flowsense/shared";

const APPS = [
  { name: "VS Code", title: "FlowSense — main.ts", url: null },
  { name: "Chrome", title: "GitHub — flowsense-org", url: "https://github.com/flowsense-org" },
  { name: "Slack", title: "general — FlowSense Team", url: null },
  { name: "Notion", title: "Q4 Roadmap", url: "https://notion.so/roadmap-q4" },
  { name: "Figma", title: "Dashboard v3 — Figma", url: "https://figma.com/file/abc123" },
  { name: "Terminal", title: "npm run dev", url: null },
  { name: "Chrome", title: "Recharts docs", url: "https://recharts.org" },
  { name: "Mail", title: "Inbox (3 unread)", url: null },
  { name: "Linear", title: "FLW-421 Add timeline view", url: "https://linear.app/flowsense/issue/FLW-421" },
  { name: "Spotify", title: "Lo-fi Beats playlist", url: null },
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export function buildMockActivity(limit = 50): ActivityListResponse {
  const now = Date.now();
  const items: ActivityEvent[] = Array.from({ length: limit }).map((_, i) => {
    const app = pick(APPS, i * 3 + 1);
    const ts = new Date(now - i * 1000 * 60 * (4 + (i % 5)));
    return {
      id: 1000 - i,
      timestamp: ts.toISOString(),
      application: app.name,
      window_title: app.title,
      url: app.url,
      event_type: app.url ? "browser_tab" : "window_focus",
      duration_ms: 60_000 + (i % 12) * 15_000,
      session_id: "mock-session-0",
      created_at: ts.toISOString(),
    };
  });
  return { items, total: 500, page: 1, limit };
}

export function buildMockAnalytics(): AnalyticsSummary {
  return {
    productive_minutes: 312,
    idle_minutes: 48,
    app_switches: 87,
    most_used_apps: [
      { application: "VS Code", minutes: 142 },
      { application: "Chrome", minutes: 89 },
      { application: "Figma", minutes: 36 },
      { application: "Slack", minutes: 28 },
      { application: "Notion", minutes: 17 },
    ],
    workflow_count: 6,
  };
}

export function buildMockDailyTrend(days = 30): DailyTrendPoint[] {
  const out: DailyTrendPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const seed = Math.sin(i / 3) * 60 + 240;
    out.push({
      date: d.toISOString().slice(0, 10),
      productive_minutes: Math.max(60, Math.round(seed + (i % 4) * 20)),
      idle_minutes: Math.max(10, Math.round(60 + Math.cos(i / 2) * 30)),
    });
  }
  return out;
}

export function buildMockAppUsage(): AppUsagePoint[] {
  const total = 312;
  const items = [
    { application: "VS Code", minutes: 142 },
    { application: "Chrome", minutes: 89 },
    { application: "Figma", minutes: 36 },
    { application: "Slack", minutes: 28 },
    { application: "Notion", minutes: 17 },
  ];
  return items.map((i) => ({
    ...i,
    percentage: Math.round((i.minutes / total) * 100),
  }));
}

export function buildMockWorkflows(): Workflow[] {
  return [
    {
      id: 1,
      hash: "wf-001",
      ai_name: "Morning standup routine",
      description:
        "Opens Slack, Linear, and Notion in sequence to review the day's priorities.",
      purpose: "Daily standup prep",
      automation_suggestion:
        "Bind to 9:00 AM trigger to open all three apps in a single click.",
      frequency: 14,
      confidence: 0.92,
      first_seen: "2026-06-10T09:00:00Z",
      last_seen: "2026-06-26T09:02:00Z",
      steps: [
        { step_order: 1, application: "Slack", window_title: "general" },
        { step_order: 2, application: "Linear", window_title: "My Issues" },
        { step_order: 3, application: "Notion", window_title: "Standup notes" },
      ],
    },
    {
      id: 2,
      hash: "wf-002",
      ai_name: "Code review flow",
      description:
        "Switches between GitHub PR, VS Code, and browser to review PRs end-to-end.",
      purpose: "Code review",
      automation_suggestion:
        "Open PR in browser, then auto-launch diff in VS Code.",
      frequency: 8,
      confidence: 0.78,
      first_seen: "2026-06-15T14:00:00Z",
      last_seen: "2026-06-25T15:30:00Z",
      steps: [
        { step_order: 1, application: "Chrome", window_title: "GitHub PR", url_pattern: "https://github.com/*/pull/*" },
        { step_order: 2, application: "VS Code", window_title: "PR diff" },
        { step_order: 3, application: "Chrome", window_title: "CI status" },
      ],
    },
    {
      id: 3,
      hash: "wf-003",
      ai_name: "Design handoff",
      description:
        "Pulls latest designs from Figma, then opens Linear to update task status.",
      purpose: "Design-to-dev handoff",
      automation_suggestion:
        "Detect Figma focus and surface the relevant Linear issue.",
      frequency: 5,
      confidence: 0.65,
      first_seen: "2026-06-18T11:00:00Z",
      last_seen: "2026-06-24T11:15:00Z",
      steps: [
        { step_order: 1, application: "Figma", window_title: "Dashboard v3" },
        { step_order: 2, application: "Linear", window_title: "FLW-421" },
        { step_order: 3, application: "Slack", window_title: "design-team" },
      ],
    },
    {
      id: 4,
      hash: "wf-004",
      ai_name: "Deep work block",
      description:
        "Closes Slack and Spotify, opens VS Code in zen mode for focused coding.",
      purpose: "Deep work",
      automation_suggestion:
        "Trigger on calendar 'Focus' event or manual hotkey.",
      frequency: 12,
      confidence: 0.88,
      first_seen: "2026-06-08T10:00:00Z",
      last_seen: "2026-06-26T10:00:00Z",
      steps: [
        { step_order: 1, application: "Slack", window_title: "Closed" },
        { step_order: 2, application: "Spotify", window_title: "Closed" },
        { step_order: 3, application: "VS Code", window_title: "FlowSense" },
      ],
    },
  ];
}

export function buildMockSuggestions(): Suggestion[] {
  return [
    {
      id: 101,
      workflow_id: 1,
      status: "pending",
      shown_at: "2026-06-27T08:55:00Z",
      workflow: {
        id: 1,
        ai_name: "Morning standup routine",
        frequency: 14,
        confidence: 0.92,
        description: "Opens Slack, Linear, and Notion in sequence.",
        automation_suggestion:
          "Bind to 9:00 AM trigger to open all three apps in a single click.",
      },
    },
    {
      id: 102,
      workflow_id: 4,
      status: "pending",
      shown_at: "2026-06-27T09:01:00Z",
      workflow: {
        id: 4,
        ai_name: "Deep work block",
        frequency: 12,
        confidence: 0.88,
        description:
          "Closes Slack and Spotify, opens VS Code in zen mode.",
        automation_suggestion:
          "Trigger on calendar 'Focus' event or manual hotkey.",
      },
    },
    {
      id: 103,
      workflow_id: 2,
      status: "pending",
      shown_at: "2026-06-26T15:30:00Z",
      workflow: {
        id: 2,
        ai_name: "Code review flow",
        frequency: 8,
        confidence: 0.78,
        description: "Switches between GitHub PR, VS Code, and browser.",
        automation_suggestion:
          "Open PR in browser, then auto-launch diff in VS Code.",
      },
    },
  ];
}
