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
// Chrome's Manifest V3 alarms have a minimum interval of 30 seconds. Tab
// activation and navigation events still trigger immediate captures.
const ALARM_PERIOD_MINUTES = 0.5;
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

function updateBadge(): void {
  void chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
  void chrome.action.setBadgeText({ text: monitoring ? "ON" : "" });
}

function startMonitoring(): void {
  if (monitoring) return;
  monitoring = true;
  updateBadge();
  chrome.alarms.create("poll-tab", { periodInMinutes: ALARM_PERIOD_MINUTES });
  void captureAndSend();
}

function stopMonitoring(): void {
  monitoring = false;
  lastSent = null;
  updateBadge();
  chrome.alarms.clear("poll-tab");
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function restoreMonitoring(): void {
  chrome.storage.local.get(["monitoring"], (result) => {
    if (result.monitoring) startMonitoring();
    else updateBadge();
  });
}

chrome.runtime.onInstalled.addListener(restoreMonitoring);
chrome.runtime.onStartup.addListener(restoreMonitoring);
restoreMonitoring();

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
    chrome.storage.local.get(["monitoring"], (result) => {
      sendResponse({ monitoring: Boolean(result.monitoring) });
    });
    return true;
  }
  return false;
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
  if (alarm.name === "poll-tab") {
    chrome.storage.local.get(["monitoring"], (result) => {
      monitoring = Boolean(result.monitoring);
      if (monitoring) void captureAndSend();
    });
  }
});

chrome.tabs.onActivated.addListener(() => {
  if (monitoring) captureAndSend();
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (monitoring && changeInfo.url) captureAndSend();
});
