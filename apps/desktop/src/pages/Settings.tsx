import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { useExportData, useSettings, useUpdateSetting } from "../hooks/use-api.js";
import { useApp } from "../store.jsx";
import { SettingsSection } from "../components/settings/SettingsSection.jsx";
import { ToggleRow } from "../components/settings/ToggleRow.jsx";
import { DangerZone } from "../components/settings/DangerZone.jsx";
import { Slider } from "../components/ui/Slider.jsx";
import { AccentSelect } from "../components/ui/AccentSelect.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { ipc } from "../lib/ipc.js";

export function SettingsPage(): JSX.Element {
  const { data: backendSettings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const exportData = useExportData();
  const { settings, updateSetting: localUpdate, resetSettings } = useApp();
  const [exporting, setExporting] = useState(false);

  const handleExport = async (): Promise<void> => {
    setExporting(true);
    try {
      const result = await exportData.mutateAsync();
      if (result?.ok) {
        ipc().notifications.show({
          title: "Data exported",
          body: `Saved to ${result.path}`,
        });
      } else if (result && !result.ok) {
        ipc().notifications.show({
          title: "Export cancelled",
          body: result.error ?? "No file selected.",
        });
      }
    } finally {
      setExporting(false);
    }
  };

  const handleClearHistory = (): void => {
    ipc().notifications.show({
      title: "History cleared",
      body: "All tracked activity has been removed.",
    });
  };

  if (isLoading && !backendSettings) {
    return (
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-fg">Settings</h1>
        <p className="text-sm text-fg-muted">
          Customize how FlowSense behaves on this device.
        </p>
      </div>

      <SettingsSection
        title="Monitoring"
        description="Control how FlowSense tracks your activity."
      >
        <ToggleRow
          label="Enable monitoring"
          description="Track active window and app usage."
          checked={settings.monitoring}
          onChange={(v) => {
            localUpdate("monitoring", v);
            updateSetting.mutate({ key: "monitoring", value: v });
          }}
        />
        <Slider
          value={settings.polling_interval}
          onChange={(v) => {
            localUpdate("polling_interval", v);
            updateSetting.mutate({ key: "polling_interval", value: v });
          }}
          min={1}
          max={30}
          step={1}
          label="Polling interval"
          formatValue={(v) => `${v}s`}
        />
        <ToggleRow
          label="Browser tracking"
          description="Capture URLs from browser tabs."
          checked={settings.browser_tracking}
          onChange={(v) => {
            localUpdate("browser_tracking", v);
            updateSetting.mutate({ key: "browser_tracking", value: v });
          }}
        />
      </SettingsSection>

      <SettingsSection
        title="AI features"
        description="Configure AI-powered suggestions."
      >
        <ToggleRow
          label="AI suggestions"
          description="Surface AI-generated workflow suggestions."
          checked={settings.ai_suggestions}
          onChange={(v) => {
            localUpdate("ai_suggestions", v);
            updateSetting.mutate({ key: "ai_suggestions", value: v });
          }}
        />
        <ToggleRow
          label="Gemini integration"
          description="Use Gemini for richer explanations."
          checked={settings.gemini_enabled}
          onChange={(v) => {
            localUpdate("gemini_enabled", v);
            updateSetting.mutate({ key: "gemini_enabled", value: v });
          }}
          disabled={!settings.ai_suggestions}
        />
      </SettingsSection>

      <SettingsSection
        title="Appearance"
        description="Make FlowSense yours."
      >
        <ToggleRow
          label="Dark mode"
          description="Use a dark color scheme."
          checked={settings.dark_mode}
          onChange={(v) => {
            localUpdate("dark_mode", v);
            updateSetting.mutate({ key: "dark_mode", value: v });
          }}
        />
      </SettingsSection>

      <SettingsSection
        title="Privacy"
        description="Manage your data and retention."
      >
        <AccentSelect
          value={settings.retention_period}
          onChange={(v) => {
            localUpdate("retention_period", v);
            updateSetting.mutate({ key: "retention_period", value: v as never });
          }}
          options={[
            { value: "7d", label: "7 days" },
            { value: "30d", label: "30 days" },
            { value: "90d", label: "90 days" },
            { value: "unlimited", label: "Unlimited" },
          ]}
        />
        <ToggleRow
          label="Launch at startup"
          description="Start FlowSense when you log in."
          checked={settings.startup_launch}
          onChange={(v) => {
            localUpdate("startup_launch", v);
            updateSetting.mutate({ key: "startup_launch", value: v });
          }}
        />
      </SettingsSection>

      <SettingsSection
        title="Data"
        description="Export or clear your tracked data."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download size={14} />
            {exporting ? "Exporting…" : "Export data"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleClearHistory}
          >
            <Trash2 size={14} />
            Clear history
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => resetSettings()}
          >
            Reset to defaults
          </Button>
        </div>
      </SettingsSection>

      <DangerZone onClearHistory={handleClearHistory} onExportData={handleExport} />

      <div className="text-[10px] text-fg-subtle text-center pt-4">
        FlowSense v0.1.0 · Made with care
      </div>
    </div>
  );
}
