export interface Settings {
  polling_interval: number;
  dark_mode: boolean;
  notifications: boolean;
  retention_period: string;
  gemini_enabled: boolean;
  startup_launch: boolean;
  browser_tracking: boolean;
  ai_suggestions: boolean;
}

export type SettingsKey = keyof Settings;

export interface SettingsUpdate {
  key: SettingsKey;
  value: Settings[SettingsKey];
}

export const DEFAULT_SETTINGS: Settings = {
  polling_interval: 5,
  dark_mode: true,
  notifications: true,
  retention_period: "unlimited",
  gemini_enabled: false,
  startup_launch: false,
  browser_tracking: true,
  ai_suggestions: true,
};
