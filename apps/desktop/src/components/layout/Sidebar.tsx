import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Command,
  LayoutDashboard,
  Workflow,
} from "lucide-react";
import { cn } from "../../lib/utils.js";
import { useApp, type Route } from "../../store.jsx";
import { useState } from "react";

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
  { route: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
];

export function Sidebar(): JSX.Element {
  const { route, setRoute, monitoring } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => setCollapsed(!collapsed);

  return (
    <aside className={cn(
      "flex flex-col shrink-0 h-full border-r border-border-subtle bg-bg transition-all duration-200",
      collapsed ? "w-14" : "w-56"
    )}>
      <div className={cn(
        "flex items-center gap-2 px-4 h-14 border-b border-border-subtle",
        collapsed && "justify-center"
      )}>
        <div className="relative w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Command size={14} className="text-accent" />
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
              monitoring ? "bg-success animate-pulse-dot" : "bg-fg-subtle"
            )}
          />
        </div>
        {!collapsed && (
          <div className="leading-tight flex-1 min-w-0">
            <div className="text-sm font-semibold text-fg truncate">FlowSense</div>
            <div className="text-[10px] text-fg-subtle font-mono">
              {monitoring ? "monitoring" : "paused"}
            </div>
          </div>
        )}
      </div>
      <nav
        className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto"
      >
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
                  : "text-fg-muted hover:bg-bg-hover hover:text-fg",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <span
                className={cn(
                  "transition-colors flex-shrink-0",
                  active ? "text-accent" : "text-fg-subtle"
                )}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}
              {!collapsed && item.shortcut && (
                <kbd className="font-mono text-[10px] text-fg-subtle bg-bg-subtle border border-border-subtle rounded px-1.5 py-0.5">
                  {item.shortcut}
                </kbd>
              )}
            </button>
          );
        })}
      </nav>
      <div className={cn(
        "px-4 py-3 border-t border-border-subtle flex-shrink-0",
        collapsed && "flex justify-center"
      )}>
        {!collapsed ? (
          <div className="text-[10px] text-fg-subtle leading-tight">
            AI-powered focus companion
            <br />v2.0.2
          </div>
        ) : null}
        <button
          onClick={toggleCollapsed}
          type="button"
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-md hover:bg-bg-hover transition-colors",
            collapsed ? "mt-2" : "ml-auto"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} className="text-fg-subtle" /> : <ChevronLeft size={14} className="text-fg-subtle" />}
        </button>
      </div>
    </aside>
  );
}
