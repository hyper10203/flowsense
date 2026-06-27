import type { FlowSenseAPI } from "../../electron/preload.js";

declare global {
  interface Window {
    flowSense: FlowSenseAPI;
  }
}

export function ipc(): FlowSenseAPI {
  return window.flowSense;
}
