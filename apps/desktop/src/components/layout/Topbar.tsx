import { useEffect, useRef, useState } from "react";
import {
  Command,
  Moon,
  Play,
  RefreshCw,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { cn } from "../../lib/utils.js";
import { ipc } from "../../lib/ipc.js";
import { useApp } from "../../store.jsx";

interface TopbarProps {
  onSearchClick: () => void;
  onRefresh: () => void;
}

export function Topbar({
  onSearchClick,
  onRefresh,
  onSettings,
}: TopbarProps & { onSettings: () => void }): JSX.Element {
  const { theme, toggleTheme, monitoring, setMonitoring, backendReachable, activeFlow } =
    useApp();
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep store's monitoring flag in sync with electron (e.g. auto-start).
  useEffect(() => {
    ipc().monitoring.status().then((s) => {
      if (s.active !== monitoring) setMonitoring(s.active);
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        onSearchClick();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSearchClick]);

  return (
    <header className="flex items-center gap-3 h-14 px-4 border-b border-border-subtle bg-bg shrink-0">
      <button
        type="button"
        onClick={() => {
          onSearchClick();
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          "flex-1 flex items-center gap-2 h-9 px-3 rounded-lg",
          "bg-bg-elevated border border-border text-fg-muted text-sm",
          "transition-colors duration-150 hover:bg-bg-hover hover:text-fg",
          searchFocused && "ring-2 ring-accent/40 border-accent/60"
        )}
      >
        <Search size={14} className="text-fg-subtle" />
        <span className="flex-1 text-left truncate">
          Search apps, URLs, titles…
        </span>
        <kbd className="font-mono text-[10px] text-fg-subtle bg-bg-subtle border border-border-subtle rounded px-1.5 py-0.5">
          Ctrl+K
        </kbd>
      </button>

      <div className="flex items-center gap-1">
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 h-9 rounded-lg text-xs font-medium border",
            monitoring
              ? "bg-success/10 text-success border-success/20"
              : "bg-bg-elevated text-fg-muted border-border"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              monitoring ? "bg-success animate-pulse-dot" : "bg-fg-subtle"
            )}
          />
          {monitoring ? "Live" : "Paused"}
        </div>
        {activeFlow && (
          <div className="flex items-center gap-1.5 px-2.5 h-9 rounded-lg text-xs font-medium border bg-accent/10 text-accent border-accent/20">
            <Play size={10} className="fill-accent" />
            Flow
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMonitoring(!monitoring)}
          title={monitoring ? "Pause monitoring" : "Start monitoring"}
        >
          <RefreshCw size={14} className={monitoring ? "animate-spin" : ""} style={monitoring ? { animationDuration: "3s" } : undefined} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          title="Refresh (Ctrl+R)"
        >
          <RefreshCw size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettings}
          title="Settings (Ctrl+,)"
        >
          <Settings size={14} />
        </Button>
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            backendReachable ? "bg-success" : "bg-warning"
          )}
          title={
            backendReachable
              ? "Connected to backend"
              : "Backend unreachable — start backend to see live data"
          }
        />
      </div>
      <input
        ref={inputRef}
        className="sr-only"
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
        readOnly
      />
    </header>
  );
}
