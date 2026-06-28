export type AiProvider = "gemini" | "openrouter" | "nvidia_nim" | "deepseek";

export interface ApiProviderConfig {
  provider: AiProvider;
  api_key: string;
  model: string;
  enabled: boolean;
}

export interface Settings {
  polling_interval: number;
  dark_mode: boolean;
  notifications: boolean;
  retention_period: string;
  gemini_enabled: boolean;
  startup_launch: boolean;
  browser_tracking: boolean;
  ai_suggestions: boolean;
  ai_provider: AiProvider;
  ai_api_key: string;
  ai_model: string;
  terminal_tracking: boolean;
  browser_url_tracking: boolean;
}

export type SettingsKey = keyof Settings;

export interface SettingsUpdate {
  key: SettingsKey;
  value: Settings[SettingsKey];
}

export const AI_PROVIDERS: { id: AiProvider; label: string; defaultModel: string; keyPlaceholder: string }[] = [
  { id: "gemini", label: "Google Gemini", defaultModel: "gemini-2.0-flash", keyPlaceholder: "GEMINI_API_KEY" },
  { id: "openrouter", label: "OpenRouter", defaultModel: "google/gemini-2.0-flash-001:free", keyPlaceholder: "sk-or-..." },
  { id: "nvidia_nim", label: "NVIDIA NIM", defaultModel: "google/gemma-2-27b-it", keyPlaceholder: "nvapi-..." },
  { id: "deepseek", label: "DeepSeek", defaultModel: "deepseek-chat", keyPlaceholder: "sk-..." },
];

export const DEFAULT_SETTINGS: Settings = {
  polling_interval: 5,
  dark_mode: true,
  notifications: true,
  retention_period: "unlimited",
  gemini_enabled: false,
  startup_launch: false,
  browser_tracking: true,
  ai_suggestions: true,
  ai_provider: "gemini",
  ai_api_key: "",
  ai_model: "gemini-2.0-flash",
  terminal_tracking: true,
  browser_url_tracking: true,
};
