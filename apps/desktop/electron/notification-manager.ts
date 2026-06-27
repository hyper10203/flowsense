import type { BrowserWindow } from "electron";

export interface AppNotification {
  title: string;
  body: string;
  silent?: boolean;
}

export class NotificationManager {
  private window: BrowserWindow | null = null;

  setWindow(win: BrowserWindow): void {
    this.window = win;
  }

  show(n: AppNotification): void {
    if (!this.window) return;
    this.window.webContents.send("notification:toast", {
      id: crypto.randomUUID(),
      title: n.title,
      body: n.body,
      silent: n.silent ?? false,
      createdAt: new Date().toISOString(),
    });
  }

  notifyTrackingStarted(): void {
    this.show({
      title: "FlowSense tracking",
      body: "Monitoring your activity in the background.",
      silent: true,
    });
  }

  notifyTrackingStopped(): void {
    this.show({
      title: "FlowSense paused",
      body: "Activity monitoring is paused.",
      silent: true,
    });
  }

  notifyWorkflowAccepted(name: string): void {
    this.show({
      title: "Workflow saved",
      body: `"${name}" added to your workflows.`,
      silent: true,
    });
  }

  notifySuggestionAccepted(): void {
    this.show({
      title: "Suggestion applied",
      body: "AI suggestion has been accepted.",
      silent: true,
    });
  }

  notifyDataExported(path: string): void {
    this.show({
      title: "Data exported",
      body: `Saved to ${path}`,
    });
  }
}
