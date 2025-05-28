import { UIComponents } from "./ui-components.js";

export class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
  }

  init() {
    this.setupInstallPrompt();
    this.setupOfflineDetection();
    this.setupServiceWorker();
    this.setupSyncQueue();
    this.checkInstallStatus();
  }

  setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener("appinstalled", () => {
      this.isInstalled = true;
      this.hideInstallButton();
      UIComponents.showToast("LifeTuner je uspešno instaliran!", "success");
    });
  }

  showInstallButton() {
    const installBtn = document.getElementById("installApp");
    if (installBtn) {
      installBtn.classList.remove("hidden");
      installBtn.addEventListener("click", () => this.promptInstall());
    }
  }

  hideInstallButton() {
    const installBtn = document.getElementById("installApp");
    if (installBtn) {
      installBtn.classList.add("hidden");
    }
  }

  async promptInstall() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    if (outcome === "accepted") {
      UIComponents.showToast("Instaliranje aplikacije...", "info");
    }

    this.deferredPrompt = null;
    this.hideInstallButton();
  }

  setupOfflineDetection() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.hideOfflineIndicator();
      this.processSyncQueue();
      UIComponents.showToast("Povezani ste sa internetom", "success");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.showOfflineIndicator();
      UIComponents.showToast(
        "Radite offline. Podaci će biti sinhronizovani kada se povežete.",
        "warning",
        5000
      );
    });

    if (!this.isOnline) {
      this.showOfflineIndicator();
    }
  }

  showOfflineIndicator() {
    const indicator = document.getElementById("offlineIndicator");
    if (indicator) {
      indicator.classList.remove("hidden");
    }
  }

  hideOfflineIndicator() {
    const indicator = document.getElementById("offlineIndicator");
    if (indicator) {
      indicator.classList.add("hidden");
    }
  }

  setupServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration);

          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                this.showUpdateAvailable();
              }
            });
          });
        })
        .catch((error) => {
          console.log("SW registration failed:", error);
        });

      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "CACHE_UPDATED") {
          this.showUpdateAvailable();
        }
      });
    }
  }

  showUpdateAvailable() {
    const updateBtn = document.createElement("button");
    updateBtn.className =
      "fixed bottom-4 right-4 bg-primary text-white px-4 py-2 rounded-lg shadow-lg z-50 hover:bg-blue-600 transition-colors";
    updateBtn.textContent = "Dostupno je ažuriranje";
    updateBtn.onclick = () => this.applyUpdate();
    document.body.appendChild(updateBtn);
  }

  applyUpdate() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
          window.location.reload();
        }
      });
    }
  }

  setupSyncQueue() {
    const savedQueue = localStorage.getItem("syncQueue");
    if (savedQueue) {
      this.syncQueue = JSON.parse(savedQueue);
    }
  }

  addToSyncQueue(action, data) {
    const syncItem = {
      id: Date.now() + Math.random(),
      action,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
    };

    this.syncQueue.push(syncItem);
    localStorage.setItem("syncQueue", JSON.stringify(this.syncQueue));

    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const processedItems = [];

    for (const item of this.syncQueue) {
      try {
        await this.processSyncItem(item);
        processedItems.push(item);
      } catch (error) {
        console.error("Sync failed for item:", item, error);
        item.retries = (item.retries || 0) + 1;

        if (item.retries > 3) {
          processedItems.push(item);
        }
      }
    }

    this.syncQueue = this.syncQueue.filter(
      (item) => !processedItems.includes(item)
    );
    localStorage.setItem("syncQueue", JSON.stringify(this.syncQueue));
  }

  async processSyncItem(item) {
    switch (item.action) {
      case "SAVE_DAY_DATA":
        return this.syncDayData(item.data);
      case "UPDATE_GOALS":
        return this.syncGoals(item.data);
      default:
        throw new Error(`Unknown sync action: ${item.action}`);
    }
  }

  async syncDayData(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Synced day data:", data);
        resolve();
      }, 1000);
    });
  }

  async syncGoals(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Synced goals:", data);
        resolve();
      }, 1000);
    });
  }

  checkInstallStatus() {
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone
    ) {
      this.isInstalled = true;
      this.hideInstallButton();
    }
  }

  setupShortcuts() {
    if ("navigator" in window && "setAppBadge" in navigator) {
      const pendingActions = this.syncQueue.length;
      if (pendingActions > 0) {
        navigator.setAppBadge(pendingActions);
      } else {
        navigator.clearAppBadge();
      }
    }
  }

  async shareProgress(data) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Moj LifeTuner progress",
          text: `Evo mog napretka za danas: Energija ${data.energy}/10, Raspoloženje ${data.mood}/5`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share failed:", error);
        this.fallbackShare(data);
      }
    } else {
      this.fallbackShare(data);
    }
  }

  fallbackShare(data) {
    const shareText = `Moj LifeTuner progress: Energija ${data.energy}/10, Raspoloženje ${data.mood}/5`;
    navigator.clipboard.writeText(shareText).then(() => {
      UIComponents.showToast("Progress kopiran u clipboard!", "success");
    });
  }

  async requestWakeLock() {
    if ("wakeLock" in navigator) {
      try {
        const wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => {
          console.log("Wake lock released");
        });
        return wakeLock;
      } catch (error) {
        console.log("Wake lock failed:", error);
      }
    }
  }
}
