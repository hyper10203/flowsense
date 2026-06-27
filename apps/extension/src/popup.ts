const statusDot = document.getElementById("status-dot") as HTMLSpanElement;
const statusText = document.getElementById("status-text") as HTMLSpanElement;
const toggleBtn = document.getElementById("toggle") as HTMLButtonElement;

let isMonitoring = false;

function render(): void {
  if (isMonitoring) {
    statusDot.className = "dot dot-on";
    statusText.textContent = "Tracking active";
    toggleBtn.textContent = "Stop tracking";
    toggleBtn.classList.add("stop");
  } else {
    statusDot.className = "dot dot-off";
    statusText.textContent = "Not tracking";
    toggleBtn.textContent = "Start tracking";
    toggleBtn.classList.remove("stop");
  }
}

async function getStatus(): Promise<void> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage("status", (response) => {
      isMonitoring = Boolean(response?.monitoring);
      render();
      resolve();
    });
  });
}

toggleBtn.addEventListener("click", async () => {
  const message = isMonitoring ? "stop" : "start";
  await new Promise<void>((resolve) => {
    chrome.runtime.sendMessage(message, () => resolve());
  });
  isMonitoring = !isMonitoring;
  render();
});

getStatus();
