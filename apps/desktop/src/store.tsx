import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_SETTINGS, type ActiveFlowSession, type Settings } from "@flowsense/shared";
import { ipc } from "./lib/ipc.js";
import { isBackendReachable } from "./lib/api.js";

export type Theme = "dark" | "light";
export type Route =
  | "dashboard"
  | "timeline"
  | "workflows"
  | "analytics"
  | "search"
  | "settings";

interface AppState {
  route: Route;
  setRoute: (r: Route) => void;
  theme: Theme;
  toggleTheme: () => void;
  monitoring: boolean;
  setMonitoring: (v: boolean) => void;
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
  backendReachable: boolean;
  refreshBackendStatus: () => void;
  activeFlow: ActiveFlowSession | null;
  setActiveFlow: (s: ActiveFlowSession | null) => void;
  toasts: ToastEntry[];
  pushToast: (t: Omit<ToastEntry, "id" | "createdAt">) => void;
  dismissToast: (id: string) => void;
}

export interface ToastEntry {
  id: string;
  title: string;
  body: string;
  silent: boolean;
  createdAt: string;
}

// Dark is the default — only add the `light` class when user opts in.
function applyThemeClass(t: Theme): void {
  document.documentElement.classList.toggle("light", t === "light");
  document.documentElement.classList.toggle("dark", t !== "light");
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }): JSX.Element {
  const [route, setRoute] = useState<Route>("dashboard");
  const [theme, setTheme] = useState<Theme>("dark");
  const [monitoring, setMonitoringState] = useState<boolean>(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [backendReachable, setBackendReachable] = useState<boolean>(false);
  const [activeFlow, setActiveFlow] = useState<ActiveFlowSession | null>(null);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const refreshBackendStatus = useCallback(async () => {
    try {
      setBackendReachable(await isBackendReachable());
    } catch {
      setBackendReachable(false);
    }
  }, []);

  useEffect(() => {
    refreshBackendStatus();
    const t = setInterval(refreshBackendStatus, 30_000);
    return () => clearInterval(t);
  }, [refreshBackendStatus]);

  useEffect(() => {
    let cancelled = false;
    void ipc()
      .settings.get<Partial<Settings>>("")
      .then((stored) => {
        if (!cancelled && stored && typeof stored === "object") {
          setSettings({ ...DEFAULT_SETTINGS, ...stored });
        }
      })
      .catch(() => {
        // The renderer remains usable with the shared defaults.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const stored = (localStorage.getItem("flowsense:theme") as Theme | null) ?? "dark";
    setTheme(stored);
    applyThemeClass(stored);
  }, []);

  // Keep theme class in sync with the dark_mode setting (Settings page toggle).
  useEffect(() => {
    const useLight = !settings.dark_mode;
    applyThemeClass(useLight ? "light" : "dark");
    if ((useLight && theme !== "light") || (!useLight && theme !== "dark")) {
      setTheme(useLight ? "light" : "dark");
    }
  }, [settings.dark_mode]);

  useEffect(() => {
    const handler = (
      payload: { key: string; value: unknown }
    ): void => {
      if (payload.key === "all") {
        setSettings({ ...DEFAULT_SETTINGS });
        return;
      }
      setSettings((prev) => ({ ...prev, [payload.key]: payload.value }));
    };
    const unsub = ipc().settings.onChanged(handler);
    return () => {
      unsub();
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("flowsense:theme", next);
      applyThemeClass(next);
      setSettings((current) => ({ ...current, dark_mode: next === "dark" }));
      void ipc().settings.set("dark_mode", next === "dark");
      return next;
    });
  }, []);

  const setMonitoring = useCallback(async (v: boolean) => {
    try {
      if (v) await ipc().monitoring.start();
      else await ipc().monitoring.stop();
      setMonitoringState(v);
    } catch {
      // Keep the visible state unchanged when the main process is unavailable.
    }
  }, []);

  const updateSetting = useCallback(
    async <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      try {
        await ipc().settings.set(key, value);
      } catch {
        // ignore — local state still updates
      }
    },
    []
  );

  const resetSettings = useCallback(async () => {
    try {
      await ipc().settings.reset();
    } catch {
      setSettings({ ...DEFAULT_SETTINGS });
    }
  }, []);

  const pushToast = useCallback(
    (t: Omit<ToastEntry, "id" | "createdAt">) => {
      const entry: ToastEntry = {
        ...t,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setToasts((prev) => [...prev, entry]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== entry.id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    const unsub = ipc().notifications.onToast((payload) => {
      const p = payload as {
        id: string;
        title: string;
        body: string;
        silent: boolean;
        createdAt: string;
      };
      setToasts((prev) => [...prev, p]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== p.id));
      }, 4500);
    });
    return () => {
      unsub();
    };
  }, []);

  // Keep `monitoring` state in sync with electron (auto-start, tray toggles).
  useEffect(() => {
    const unsub = ipc().monitoring.onStateChanged((active) => {
      setMonitoringState(active);
    });
    return () => {
      unsub();
    };
  }, []);

  const value = useMemo<AppState>(
    () => ({
      route,
      setRoute,
      theme,
      toggleTheme,
      monitoring,
      setMonitoring,
      settings,
      updateSetting,
      resetSettings,
      backendReachable,
      refreshBackendStatus,
      activeFlow,
      setActiveFlow,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      route,
      theme,
      toggleTheme,
      monitoring,
      setMonitoring,
      settings,
      updateSetting,
      resetSettings,
      backendReachable,
      refreshBackendStatus,
      activeFlow,
      toasts,
      pushToast,
      dismissToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
