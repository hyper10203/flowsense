/**
 * FlowSense Chrome Extension — Manifest V3 service worker.
 *
 * Captures active tab URL, title, and domain and POSTs them
 * to the local FlowSense backend. Never captures form data,
 * cookies, passwords, or page DOM content.
 */

const BACKEND_URL = "http://127.0.0.1:8000";
const ACTIVITY_ENDPOINT = `${BACKEND_URL}/api/v1/extension/activity`;
const POLL_INTERVAL_MS = 5000;
const RECONNECT_DELAY_MS = 30_000;

interface TabActivity {
  url: string;
  title: string;
  domain: string;
  timestamp: string;
}

let monitoring = false;
let lastSent: TabActivity | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function isPrivateUrl(url: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "chrome:" ||
      parsed.protocol === "chrome-extension:" ||
      parsed.protocol === "about:" ||
      parsed.protocol === "edge:" ||
      parsed.protocol === "brave:"
    );
  } catch {
    return true;
  }
}

async function sendActivity(activity: TabActivity): Promise<boolean> {
  try {
    const response = await fetch(ACTIVITY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activity),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function captureAndSend(): Promise<void> {
  if (!monitoring) return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.title) return;
    if (isPrivateUrl(tab.url)) return;

    const activity: TabActivity = {
      url: tab.url,
      title: tab.title,
      domain: extractDomain(tab.url),
      timestamp: new Date().toISOString(),
    };

    if (
      lastSent &&
      lastSent.url === activity.url &&
      lastSent.title === activity.title &&
      Date.now() - new Date(lastSent.timestamp).getTime() < POLL_INTERVAL_MS
    ) {
      return;
    }

    const sent = await sendActivity(activity);
    if (sent) {
      lastSent = activity;
    } else {
      scheduleReconnect();
    }
  } catch {
    scheduleReconnect();
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (monitoring) captureAndSend();
  }, RECONNECT_DELAY_MS);
}

function startMonitoring(): void {
  if (monitoring) return;
  monitoring = true;
  chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
  chrome.action.setBadgeText({ text: "ON" });
  chrome.alarms.create("poll-tab", { periodInMinutes: POLL_INTERVAL_MS / 60_000 });
}

function stopMonitoring(): void {
  monitoring = false;
  lastSent = null;
  chrome.action.setBadgeText({ text: "" });
  chrome.alarms.clear("poll-tab");
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["monitoring"], (result) => {
    if (result.monitoring) startMonitoring();
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message === "start") {
    chrome.storage.local.set({ monitoring: true });
    startMonitoring();
    sendResponse({ ok: true });
  } else if (message === "stop") {
    chrome.storage.local.set({ monitoring: false });
    stopMonitoring();
    sendResponse({ ok: true });
  } else if (message === "status") {
    sendResponse({ monitoring });
  }
  return true;
});

chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: 320,
    height: 420,
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "poll-tab" && monitoring) {
    captureAndSend();
  }
});

chrome.tabs.onActivated.addListener(() => {
  if (monitoring) captureAndSend();
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (monitoring && changeInfo.url) captureAndSend();
});
