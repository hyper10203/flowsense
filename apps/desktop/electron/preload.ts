import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "./ipc-channels.js";

type Listener<T = unknown> = (payload: T) => void;

const flowSense = {
  monitoring: {
    start: () => ipcRenderer.invoke(IPC.MONITORING_START),
    stop: () => ipcRenderer.invoke(IPC.MONITORING_STOP),
    status: () =>
      ipcRenderer.invoke(IPC.MONITORING_STATUS) as Promise<{
        active: boolean;
        interval: number;
      }>,
    toggle: () => ipcRenderer.invoke("monitoring:toggle") as Promise<boolean>,
    onStateChanged: (cb: Listener<boolean>) => {
      const handler = (_e: unknown, payload: unknown) =>
        cb(payload as boolean);
      ipcRenderer.on(IPC.MONITORING_STATE_CHANGED, handler);
      return () =>
        ipcRenderer.removeListener(IPC.MONITORING_STATE_CHANGED, handler);
    },
  },
  activity: {
    onTracked: (cb: Listener) => {
      const handler = (_e: unknown, payload: unknown) => cb(payload);
      ipcRenderer.on(IPC.ACTIVITY_TRACKED, handler);
      return () => ipcRenderer.removeListener(IPC.ACTIVITY_TRACKED, handler);
    },
  },
  data: {
    export: () =>
      ipcRenderer.invoke(IPC.EXPORT_DATA) as Promise<{
        ok: boolean;
        path?: string;
        error?: string;
      }>,
  },
  notifications: {
    show: (payload: { title: string; body: string; silent?: boolean }) =>
      ipcRenderer.invoke(IPC.NOTIFICATION_SHOW, payload),
    onToast: (cb: Listener) => {
      const handler = (_e: unknown, payload: unknown) => cb(payload);
      ipcRenderer.on("notification:toast", handler);
      return () => ipcRenderer.removeListener("notification:toast", handler);
    },
  },
  settings: {
    get: <T = unknown>(key: string) =>
      ipcRenderer.invoke(IPC.SETTINGS_GET, key) as Promise<T>,
    set: <T = unknown>(key: string, value: T) =>
      ipcRenderer.invoke(IPC.SETTINGS_SET, key, value),
    reset: () => ipcRenderer.invoke("settings:reset"),
    onChanged: (cb: Listener<{ key: string; value: unknown }>) => {
      const handler = (_e: unknown, payload: unknown) => cb(payload as never);
      ipcRenderer.on(IPC.SETTINGS_CHANGED, handler);
      return () => ipcRenderer.removeListener(IPC.SETTINGS_CHANGED, handler);
    },
  },
  system: {
    getVersion: () =>
      ipcRenderer.invoke(IPC.VERSION_GET) as Promise<{
        version: string;
        electron: string;
        chrome: string;
        node: string;
        platform: string;
      }>,
    hide: () => ipcRenderer.invoke("app:hide"),
    openExternal: (url: string) => ipcRenderer.invoke("app:openExternal", url),
    openApp: (appName: string) => ipcRenderer.invoke(IPC.APP_OPEN, appName) as Promise<boolean>,
    overlayShow: (state: {
      currentStep: number;
      totalSteps: number;
      appName: string;
      workflowName: string;
      isComplete: boolean;
    }) => ipcRenderer.invoke(IPC.OVERLAY_SHOW, state) as Promise<void>,
    overlayUpdate: (state: {
      currentStep: number;
      totalSteps: number;
      appName: string;
      workflowName: string;
      isComplete: boolean;
    }) => ipcRenderer.invoke(IPC.OVERLAY_UPDATE, state) as Promise<void>,
    createDesktopShortcut: () => ipcRenderer.invoke("shortcut:desktop") as Promise<boolean>,
    pinToTaskbar: () => ipcRenderer.invoke("shortcut:taskbar") as Promise<boolean>,
    installShortcuts: () => ipcRenderer.invoke("shortcut:install") as Promise<boolean>,
    overlayHide: () => ipcRenderer.invoke(IPC.OVERLAY_HIDE) as Promise<void>,
    onOverlayNext: (cb: Listener<string>) => {
      const handler = (_e: unknown, payload: unknown) => cb(payload as string);
      ipcRenderer.on("overlay:next", handler);
      return () => ipcRenderer.removeListener("overlay:next", handler);
    },
    onOverlayComplete: (cb: Listener) => {
      const handler = () => cb(undefined);
      ipcRenderer.on("overlay:complete", handler);
      return () => ipcRenderer.removeListener("overlay:complete", handler);
    },
    onOverlayClose: (cb: Listener) => {
      const handler = () => cb(undefined);
      ipcRenderer.on("overlay:close", handler);
      return () => ipcRenderer.removeListener("overlay:close", handler);
    },
    onLock: (cb: Listener) => {
      const handler = () => cb(undefined);
      ipcRenderer.on("system:locked", handler);
      return () => ipcRenderer.removeListener("system:locked", handler);
    },
    onUnlock: (cb: Listener) => {
      const handler = () => cb(undefined);
      ipcRenderer.on("system:unlocked", handler);
      return () => ipcRenderer.removeListener("system:unlocked", handler);
    },
    onWindowFocus: (cb: Listener) => {
      const handler = () => cb(undefined);
      ipcRenderer.on(IPC.WINDOW_FOCUS, handler);
      return () => ipcRenderer.removeListener(IPC.WINDOW_FOCUS, handler);
    },
    onWindowBlur: (cb: Listener) => {
      const handler = () => cb(undefined);
      ipcRenderer.on(IPC.WINDOW_BLUR, handler);
      return () => ipcRenderer.removeListener(IPC.WINDOW_BLUR, handler);
    },
    onFlowShortcutTriggered: (cb: Listener<number>) => {
      const handler = (_e: unknown, payload: unknown) => cb(payload as number);
      ipcRenderer.on("flow:shortcut-triggered", handler);
      return () => ipcRenderer.removeListener("flow:shortcut-triggered", handler);
    },
    restartBackend: () => ipcRenderer.invoke("app:restartBackend") as Promise<void>,
  },

};

contextBridge.exposeInMainWorld("flowSense", flowSense);

export type FlowSenseAPI = typeof flowSense;
