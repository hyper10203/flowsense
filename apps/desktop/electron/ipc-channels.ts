export const IPC = {
  MONITORING_START: "monitoring:start",
  MONITORING_STOP: "monitoring:stop",
  MONITORING_STATUS: "monitoring:status",
  MONITORING_STATE_CHANGED: "monitoring:stateChanged",
  ACTIVITY_TRACKED: "activity:tracked",
  EXPORT_DATA: "data:export",
  EXPORT_DATA_RESULT: "data:exportResult",
  NOTIFICATION_SHOW: "notification:show",
  VERSION_GET: "version:get",
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",
  SETTINGS_CHANGED: "settings:changed",
  WINDOW_BLUR: "window:blur",
  WINDOW_FOCUS: "window:focus",
  APP_OPEN: "app:open",
  OVERLAY_SHOW: "overlay:show",
  OVERLAY_UPDATE: "overlay:update",
  OVERLAY_HIDE: "overlay:hide",
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];
