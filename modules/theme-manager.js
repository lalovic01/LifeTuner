import { UIComponents } from "./ui-components.js";

export class ThemeManager {
  constructor() {
    this.reminderTimeout = null;
  }

  setupTheme() {
    const isDark = localStorage.getItem("darkMode") === "true";
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }

  toggleTheme() {
    document.documentElement.classList.toggle("dark");
    const isDark = document.documentElement.classList.contains("dark");
    localStorage.setItem("darkMode", isDark);
  }

  setupDailyReminder() {
    if ("Notification" in window) {
      this.requestNotificationPermission();
    }

    const savedTime = localStorage.getItem("reminderTime") || "20:00";
    const reminderInput = document.getElementById("reminderTime");
    if (reminderInput) {
      reminderInput.value = savedTime;
    }

    this.scheduleNextReminder(savedTime);
  }

  requestNotificationPermission() {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  setDailyReminder(time) {
    localStorage.setItem("reminderTime", time);
    this.scheduleNextReminder(time);
    UIComponents.showToast("Podsetnik je postavljen!", "success");
  }

  scheduleNextReminder(time) {
    if (this.reminderTimeout) {
      clearTimeout(this.reminderTimeout);
    }

    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    this.reminderTimeout = setTimeout(() => {
      this.showDailyReminder();
      this.scheduleNextReminder(time);
    }, timeUntilReminder);
  }

  showDailyReminder() {
    if (Notification.permission === "granted") {
      new Notification("LifeTuner Podsetnik", {
        body: "Vreme je da unesete podatke o vašem danu!",
        icon: "/favicon.ico",
      });
    }

    UIComponents.showToast(
      "Vreme je da unesete podatke o vašem danu!",
      "info",
      5000
    );
  }
}
