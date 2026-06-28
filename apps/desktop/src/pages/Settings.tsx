import { useState } from "react";
import { Download, Eye, EyeOff, Key, Trash2 } from "lucide-react";
import { useExportData, useSettings, useUpdateSetting } from "../hooks/use-api.js";
import { useApp } from "../store.jsx";
import { SettingsSection } from "../components/settings/SettingsSection.jsx";
import { ToggleRow } from "../components/settings/ToggleRow.jsx";
import { DangerZone } from "../components/settings/DangerZone.jsx";
import { Slider } from "../components/ui/Slider.jsx";
import { AccentSelect } from "../components/ui/AccentSelect.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { AI_PROVIDERS } from "@flowsense/shared";
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
          checked={settings.browser_tracking}
          onChange={(v) => {
            localUpdate("browser_tracking", v);
            updateSetting.mutate({ key: "browser_tracking", value: v });
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
        description="Configure AI-powered suggestions and naming."
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
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-fg">
            <Key size={13} className="text-accent" />
            AI provider
          </div>
          <AccentSelect
            value={settings.ai_provider}
            onChange={(v) => {
              const provider = AI_PROVIDERS.find((p) => p.id === v) ?? AI_PROVIDERS[0];
              localUpdate("ai_provider", v);
              updateSetting.mutate({ key: "ai_provider", value: v as never });
              // Auto-set default model when provider changes
              if (provider && settings.ai_model === "") {
                localUpdate("ai_model", provider.defaultModel);
                updateSetting.mutate({ key: "ai_model", value: provider.defaultModel as never });
              }
            }}
            options={AI_PROVIDERS.map((p) => ({ value: p.id, label: p.label }))}
          />
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-fg-muted">
              API key
            </label>
            <ApiKeyInput
              value={settings.ai_api_key}
              placeholder={AI_PROVIDERS.find((p) => p.id === settings.ai_provider)?.keyPlaceholder ?? "API key"}
              onChange={(v) => {
                localUpdate("ai_api_key", v);
                updateSetting.mutate({ key: "ai_api_key", value: v as never });
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-fg-muted">
              Model
            </label>
            <input
              type="text"
              value={settings.ai_model}
              placeholder={AI_PROVIDERS.find((p) => p.id === settings.ai_provider)?.defaultModel ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                localUpdate("ai_model", v);
                updateSetting.mutate({ key: "ai_model", value: v as never });
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-bg-subtle border border-border text-xs text-fg outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/30 transition-colors"
            />
          </div>
          <p className="text-[10px] text-fg-subtle leading-relaxed">
            Set env var <code className="px-1 py-0.5 rounded bg-bg-subtle text-accent/80">AI_API_KEY</code> and{" "}
            <code className="px-1 py-0.5 rounded bg-bg-subtle text-accent/80">AI_PROVIDER=gemini|openrouter|nvidia_nim|deepseek</code>{" "}
            on the backend, or store the key here. Restart backend to apply.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Tracking"
        description="Fine-tune what FlowSense captures."
      >
        <ToggleRow
          label="Terminal tracking"
          description="Capture active terminal and shell context."
          checked={settings.terminal_tracking}
          onChange={(v) => {
            localUpdate("terminal_tracking", v);
            updateSetting.mutate({ key: "terminal_tracking", value: v });
          }}
        />
        <ToggleRow
          label="Browser URL tracking"
          description="Capture URLs from browser tabs (Chrome/Edge/Firefox)."
          checked={settings.browser_url_tracking}
          onChange={(v) => {
            localUpdate("browser_url_tracking", v);
            updateSetting.mutate({ key: "browser_url_tracking", value: v });
          }}
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

function ApiKeyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}): JSX.Element {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type={show ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-1.5 pr-8 rounded-lg bg-bg-subtle border border-border text-xs text-fg outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/30 transition-colors font-mono"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg transition-colors"
          aria-label={show ? "Hide key" : "Show key"}
        >
          {show ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
      </div>
    </div>
  );
}
