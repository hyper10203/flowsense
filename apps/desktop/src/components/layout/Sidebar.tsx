import {
  Activity,
  BarChart3,
  Command,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
  Workflow,
} from "lucide-react";
import { cn } from "../../lib/utils.js";
import { useApp, type Route } from "../../store.jsx";

interface NavItem {
  route: Route;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const NAV: NavItem[] = [
  { route: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { route: "timeline", label: "Timeline", icon: <Activity size={16} /> },
  { route: "workflows", label: "Workflows", icon: <Workflow size={16} /> },
  { route: "suggestions", label: "Suggestions", icon: <Sparkles size={16} /> },
  { route: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
  { route: "search", label: "Search", icon: <Search size={16} />, shortcut: "⌘K" },
  { route: "settings", label: "Settings", icon: <Settings size={16} />, shortcut: "⌘," },
];

export function Sidebar(): JSX.Element {
  const { route, setRoute, monitoring } = useApp();
  return (
    <aside className="flex flex-col shrink-0 w-56 h-full border-r border-border-subtle bg-bg">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border-subtle">
        <div className="relative w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Command size={14} className="text-accent" />
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
              monitoring ? "bg-success animate-pulse-dot" : "bg-fg-subtle"
            )}
          />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-fg">FlowSense</div>
          <div className="text-[10px] text-fg-subtle font-mono">
            {monitoring ? "monitoring" : "paused"}
          </div>
        </div>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map((item) => {
          const active = route === item.route;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => setRoute(item.route)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
                "transition-colors duration-150",
                active
                  ? "bg-accent/10 text-fg font-medium"
                  : "text-fg-muted hover:bg-bg-hover hover:text-fg"
              )}
            >
              <span
                className={cn(
                  "transition-colors",
                  active ? "text-accent" : "text-fg-subtle"
                )}
              >
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut && (
                <kbd className="font-mono text-[10px] text-fg-subtle bg-bg-subtle border border-border-subtle rounded px-1.5 py-0.5">
                  {item.shortcut}
                </kbd>
              )}
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-border-subtle">
        <div className="text-[10px] text-fg-subtle leading-tight">
          AI-powered focus companion
          <br />v0.1.0
        </div>
      </div>
    </aside>
  );
}
