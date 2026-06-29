import { useCallback, useState } from "react";
import { useApp } from "./store.jsx";
import { useActiveFlow, useStopFlow } from "./hooks/use-api.js";
import { AppShell } from "./components/layout/AppShell.jsx";
import { ToastViewport } from "./components/ui/Toast.jsx";
import { FlowOverlay } from "./components/flow/FlowOverlay.jsx";
import { SetupWizard } from "./components/onboarding/SetupWizard.jsx";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.jsx";
import { DashboardPage } from "./pages/Dashboard.jsx";
import { TimelinePage } from "./pages/Timeline.jsx";
import { WorkflowsPage } from "./pages/Workflows.jsx";
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

function FlowModeLayer(): JSX.Element | null {
  const { activeFlow, setActiveFlow } = useApp();
  const stopFlow = useStopFlow();

  if (!activeFlow || !activeFlow.workflow) return null;

  return (
    <FlowOverlay
      session={activeFlow}
      onClose={() => {
        stopFlow.mutate({
          sessionId: activeFlow.id,
          stepsCompleted: activeFlow.steps_completed,
        });
        setActiveFlow(null);
      }}
      onStepUpdate={(steps) => setActiveFlow({ ...activeFlow, steps_completed: steps })}
    />
  );
}

export function App(): JSX.Element {
  const { setRoute, setActiveFlow, activeFlow } = useApp();
  const stopFlow = useStopFlow();
  const [showSetup, setShowSetup] = useState(
    () => localStorage.getItem("flowsense:setupSeen") !== "1"
  );

  const handleToggleFlow = useCallback(() => {
    if (activeFlow) {
      stopFlow.mutate({
        sessionId: activeFlow.id,
        stepsCompleted: activeFlow.steps_completed,
      });
      setActiveFlow(null);
    } else {
      setRoute("workflows");
    }
  }, [activeFlow, setActiveFlow, setRoute, stopFlow]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-bg text-fg">
      <AppShell onToggleFlow={handleToggleFlow}>
        <ErrorBoundary fallbackLabel="Page crashed">
          <ActivePage />
        </ErrorBoundary>
      </AppShell>
      <FlowModeLayer />
      <ToastViewport />
      <SetupWizard
        open={showSetup}
        onClose={() => {
          localStorage.setItem("flowsense:setupSeen", "1");
          setShowSetup(false);
        }}
      />
    </div>
  );
}
