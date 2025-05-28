import { DataManager } from "./data-manager.js";
import { UIComponents } from "./ui-components.js";

export class EventHandler {
  constructor(lifeTuner) {
    this.app = lifeTuner;
  }

  setupAllEventListeners() {
    this.setupNavigationEvents();
    this.setupFormEvents();
    this.setupInteractionEvents();
    this.setupSettingsEvents();
    this.setupModalEvents();
  }

  setupNavigationEvents() {
    document.querySelectorAll(".nav-btn, .nav-btn-mobile").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const section = e.currentTarget.getAttribute("data-section");
        this.app.showSection(section);
      });
    });

    document.getElementById("dateSelector")?.addEventListener("change", (e) => {
      this.app.currentDate = e.target.value;
      this.app.loadDayData();
    });
  }

  setupFormEvents() {
    document.getElementById("bedTime")?.addEventListener("change", () => {
      UIComponents.calculateSleepDuration();
    });

    document.getElementById("wakeTime")?.addEventListener("change", () => {
      UIComponents.calculateSleepDuration();
    });

    const energySlider = document.getElementById("energySlider");
    if (energySlider) {
      energySlider.addEventListener("input", (e) => {
        this.app.currentEnergy = parseInt(e.target.value);
        document.getElementById("energyValue").textContent =
          this.app.currentEnergy;
      });
    }

    document.getElementById("saveDayBtn")?.addEventListener("click", () => {
      this.app.saveDay();
    });
  }

  setupInteractionEvents() {
    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.app.selectMood(
          parseInt(e.currentTarget.getAttribute("data-mood"))
        );
      });
    });

    document.querySelectorAll(".activity-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.app.toggleActivity(e.currentTarget.getAttribute("data-activity"));
      });
    });

    document.querySelectorAll(".feeling-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.app.selectFeeling(e.currentTarget.getAttribute("data-feeling"));
      });
    });

    document
      .getElementById("getRecommendations")
      ?.addEventListener("click", () => {
        this.app.aiAssistant.showRecommendations(this.app.currentFeeling);
      });
  }

  setupSettingsEvents() {
    document.getElementById("darkModeToggle")?.addEventListener("click", () => {
      this.app.themeManager.toggleTheme();
    });

    document.getElementById("themeToggle")?.addEventListener("click", () => {
      this.app.themeManager.toggleTheme();
    });

    document.getElementById("exportData")?.addEventListener("click", () => {
      try {
        const message = DataManager.exportData();
        UIComponents.showToast(message, "success");
      } catch (error) {
        UIComponents.showToast(error.message, "error");
      }
    });

    document.getElementById("clearData")?.addEventListener("click", () => {
      if (
        confirm(
          "Da li ste sigurni da želite da obrišete sve podatke? Ova akcija se ne može poništiti."
        )
      ) {
        const message = DataManager.clearAllData();
        this.app.resetForm();
        UIComponents.showToast(message, "info");
      }
    });

    const exportCSVBtn = document.getElementById("exportCSV");
    if (exportCSVBtn) {
      exportCSVBtn.addEventListener("click", () => {
        try {
          const message = DataManager.exportDataCSV();
          UIComponents.showToast(message, "success");
        } catch (error) {
          UIComponents.showToast(error.message, "warning");
        }
      });
    }

    const reminderTimeInput = document.getElementById("reminderTime");
    if (reminderTimeInput) {
      reminderTimeInput.addEventListener("change", (e) => {
        this.app.themeManager.setDailyReminder(e.target.value);
      });
    }

    document.getElementById("saveGoalsBtn")?.addEventListener("click", () => {
      this.app.goalTracker.saveGoals();
      this.app.goalTracker.checkGoalProgress();
    });
  }

  setupModalEvents() {
    document
      .getElementById("startOnboarding")
      ?.addEventListener("click", () => {
        this.app.onboarding.hideOnboarding();
      });

    document.getElementById("closeDayModal")?.addEventListener("click", () => {
      UIComponents.hideModal("dayCompleteModal");
    });

    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-backdrop")) {
        UIComponents.hideModal(e.target.id);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document
          .querySelectorAll(".modal-backdrop:not(.hidden)")
          .forEach((modal) => {
            UIComponents.hideModal(modal.id);
          });
      }
    });
  }
}
