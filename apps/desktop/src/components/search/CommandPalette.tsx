import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Command, Globe, Monitor, Search } from "lucide-react";
import type { ActivityEvent } from "@flowsense/shared";
import { Card } from "../ui/Card.jsx";
import { SearchBar } from "./SearchBar.jsx";
import { formatRelative, formatDuration } from "../../lib/utils.js";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  events: ActivityEvent[];
  onOpenExternal: (url: string) => void;
}

function fuzzy(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h.includes(n)) return true;
  let i = 0;
  for (let j = 0; j < h.length && i < n.length; j++) {
    if (h[j] === n[i]) i++;
  }
  return i === n.length;
}

export function CommandPalette({
  open,
  onClose,
  events,
  onOpenExternal,
}: CommandPaletteProps): JSX.Element | null {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo<ActivityEvent[]>(() => {
    if (!query.trim()) return events.slice(0, 8);
    return events
      .filter(
        (e) =>
          fuzzy(e.application, query) ||
          fuzzy(e.window_title, query) ||
          (e.url && fuzzy(e.url, query))
      )
      .slice(0, 12);
  }, [query, events]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item?.url) {
        onOpenExternal(item.url);
      }
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
                <Command size={14} className="text-accent" />
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  autoFocus
                  placeholder="Search apps, URLs, titles…"
                />
              </div>
              <div
                className="max-h-80 overflow-auto py-1"
                onKeyDown={onKey}
                role="listbox"
                aria-label="Search results"
              >
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-fg-muted">
                    <Search size={20} className="mx-auto mb-2 text-fg-subtle" />
                    No results for "{query}"
                  </div>
                ) : (
                  filtered.map((e, i) => (
                    <button
                      key={`${e.id ?? i}-${e.timestamp}`}
                      type="button"
                      role="option"
                      aria-selected={i === activeIndex}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => {
                        if (e.url) onOpenExternal(e.url);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        i === activeIndex
                          ? "bg-bg-hover"
                          : "hover:bg-bg-hover"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-md bg-bg-elevated border border-border-subtle flex items-center justify-center text-fg-subtle">
                        {e.url ? <Globe size={13} /> : <Monitor size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-fg truncate">
                          {e.window_title}
                        </div>
                        <div className="text-xs text-fg-muted truncate">
                          {e.application}
                          {e.url && ` · ${e.url}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-fg-subtle">
                          {formatDuration(e.duration_ms)}
                        </div>
                        <div className="text-[10px] text-fg-subtle">
                          {formatRelative(e.timestamp)}
                        </div>
                      </div>
                      {e.url && (
                        <ArrowUpRight size={12} className="text-fg-subtle" />
                      )}
                    </button>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-border-subtle flex items-center gap-3 text-[10px] text-fg-subtle">
                <span>
                  <kbd className="font-mono bg-bg-subtle border border-border-subtle rounded px-1">↑↓</kbd>{" "}
                  navigate
                </span>
                <span>
                  <kbd className="font-mono bg-bg-subtle border border-border-subtle rounded px-1">↵</kbd>{" "}
                  open
                </span>
                <span>
                  <kbd className="font-mono bg-bg-subtle border border-border-subtle rounded px-1">esc</kbd>{" "}
                  close
                </span>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
