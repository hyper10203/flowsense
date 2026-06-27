import { type ReactNode, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar.jsx";
import { Topbar } from "./Topbar.jsx";
import { useApp } from "../../store.jsx";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard.js";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  const { route, setRoute, refreshBackendStatus } = useApp();

  const onSearch = useCallback(() => setRoute("search"), [setRoute]);
  const onSettings = useCallback(() => setRoute("settings"), [setRoute]);
  const onRefresh = useCallback(() => {
    refreshBackendStatus();
  }, [refreshBackendStatus]);

  const shortcuts = useMemo(
    () => ({ onSearch, onRefresh, onSettings }),
    [onSearch, onRefresh, onSettings]
  );
  useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onSearchClick={onSearch}
          onRefresh={onRefresh}
          onSettings={onSettings}
        />
        <main className="flex-1 overflow-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={route}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
