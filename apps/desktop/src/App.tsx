import { useApp } from "./store.jsx";
import { AppShell } from "./components/layout/AppShell.jsx";
import { ToastViewport } from "./components/ui/Toast.jsx";
import { DashboardPage } from "./pages/Dashboard.jsx";
import { TimelinePage } from "./pages/Timeline.jsx";
import { WorkflowsPage } from "./pages/Workflows.jsx";
import { SuggestionsPage } from "./pages/Suggestions.jsx";
import { AnalyticsPage } from "./pages/Analytics.jsx";
import { SearchPage } from "./pages/Search.jsx";
import { SettingsPage } from "./pages/Settings.jsx";

function ActivePage(): JSX.Element {
  const { route } = useApp();
  switch (route) {
    case "dashboard":
      return <DashboardPage />;
    case "timeline":
      return <TimelinePage />;
    case "workflows":
      return <WorkflowsPage />;
    case "suggestions":
      return <SuggestionsPage />;
    case "analytics":
      return <AnalyticsPage />;
    case "search":
      return <SearchPage />;
    case "settings":
      return <SettingsPage />;
    default:
      return <DashboardPage />;
  }
}

export function App(): JSX.Element {
  return (
    <div className="h-screen w-screen overflow-hidden bg-bg text-fg">
      <AppShell>
        <ActivePage />
      </AppShell>
      <ToastViewport />
    </div>
  );
}
