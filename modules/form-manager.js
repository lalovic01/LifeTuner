import { UIComponents } from "./ui-components.js";

export class FormManager {
  constructor() {
    this.validators = {
      mood: (value) => value >= 1 && value <= 5,
      energy: (value) => value >= 1 && value <= 10,
      sleepHours: (bedTime, wakeTime) => {
        if (!bedTime || !wakeTime) return false;
        const bed = new Date(`2000-01-01T${bedTime}:00`);
        let wake = new Date(`2000-01-01T${wakeTime}:00`);
        if (wake < bed) wake.setDate(wake.getDate() + 1);
        const diffHours = (wake - bed) / (1000 * 60 * 60);
        return diffHours >= 3 && diffHours <= 12;
      },
    };
    this.formState = {
      isDirty: false,
      lastSaved: null,
      validationErrors: new Map(),
    };
  }

  validateDayData(dayData) {
    const errors = [];

    if (!dayData.mood) {
      errors.push("Molimo unesite raspoloženje");
    } else if (!this.validators.mood(dayData.mood)) {
      errors.push("Raspoloženje mora biti između 1 i 5");
    }

    if (!dayData.energy) {
      errors.push("Molimo unesite nivo energije");
    } else if (!this.validators.energy(dayData.energy)) {
      errors.push("Energija mora biti između 1 i 10");
    }

    if (dayData.sleep.bedTime && dayData.sleep.wakeTime) {
      if (
        !this.validators.sleepHours(
          dayData.sleep.bedTime,
          dayData.sleep.wakeTime
        )
      ) {
        errors.push("Vreme spavanja mora biti između 3 i 12 sati");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  validateField(fieldName, value, additionalValue = null) {
    let isValid = false;
    let errorMessage = "";

    switch (fieldName) {
      case "mood":
        isValid = this.validators.mood(value);
        errorMessage = isValid ? "" : "Raspoloženje mora biti između 1 i 5";
        break;
      case "energy":
        isValid = this.validators.energy(value);
        errorMessage = isValid ? "" : "Energija mora biti između 1 i 10";
        break;
      case "sleep":
        isValid = this.validators.sleepHours(value, additionalValue);
        errorMessage = isValid
          ? ""
          : "Vreme spavanja mora biti između 3 i 12 sati";
        break;
    }

    if (isValid) {
      this.formState.validationErrors.delete(fieldName);
    } else {
      this.formState.validationErrors.set(fieldName, errorMessage);
    }

    this.updateFieldUI(fieldName, isValid, errorMessage);
    return isValid;
  }

  updateFieldUI(fieldName, isValid, errorMessage) {
    const fieldElement = document.querySelector(`[data-field="${fieldName}"]`);
    if (fieldElement) {
      if (isValid) {
        fieldElement.classList.remove("border-red-500");
        fieldElement.classList.add("border-green-500");
      } else {
        fieldElement.classList.remove("border-green-500");
        fieldElement.classList.add("border-red-500");
      }
    }

    const errorElement = document.getElementById(`${fieldName}Error`);
    if (errorElement) {
      errorElement.textContent = errorMessage;
      errorElement.classList.toggle("hidden", isValid);
    }
  }

  resetForm(app) {
    app.currentMood = null;
    app.currentEnergy = 5;
    app.selectedActivities.clear();
    app.currentFeeling = null;

    const elements = {
      bedTime: "",
      wakeTime: "",
      sleepDuration: "0h 0m",
      energySlider: "5",
      energyValue: "5",
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        if (id === "sleepDuration" || id === "energyValue") {
          element.textContent = value;
        } else {
          element.value = value;
        }
      }
    });

    document
      .querySelectorAll(".mood-btn, .activity-btn, .feeling-btn")
      .forEach((btn) => {
        btn.classList.remove("selected");
      });

    const recContainer = document.getElementById("recommendationsContainer");
    if (recContainer) {
      recContainer.classList.add("hidden");
    }
  }

  autoSave(app) {
    const autoSaveData = {
      currentMood: app.currentMood,
      currentEnergy: app.currentEnergy,
      selectedActivities: Array.from(app.selectedActivities),
      currentFeeling: app.currentFeeling,
      bedTime: document.getElementById("bedTime")?.value || "",
      wakeTime: document.getElementById("wakeTime")?.value || "",
      timestamp: new Date().toISOString(),
      version: "1.0",
    };

    try {
      const compressed = this.compressData(autoSaveData);
      localStorage.setItem(`autosave_${app.currentDate}`, compressed);
      this.formState.lastSaved = new Date();

      this.showAutoSaveIndicator();
    } catch (error) {
      console.warn("Auto-save failed:", error);
      UIComponents.showToast("Auto-save neuspešan", "warning", 2000);
    }
  }

  compressData(data) {
    return JSON.stringify(data);
  }

  decompressData(compressed) {
    return JSON.parse(compressed);
  }

  showAutoSaveIndicator() {
    const indicator = document.getElementById("autoSaveIndicator");
    if (indicator) {
      indicator.classList.remove("hidden");
      indicator.classList.add("opacity-100");

      setTimeout(() => {
        indicator.classList.remove("opacity-100");
        indicator.classList.add("opacity-0");
        setTimeout(() => {
          indicator.classList.add("hidden");
        }, 300);
      }, 2000);
    }
  }

  loadAutoSave(app) {
    try {
      const autoSaveData = localStorage.getItem(`autosave_${app.currentDate}`);
      if (autoSaveData) {
        const data = this.decompressData(autoSaveData);

        const saveDate = new Date(data.timestamp);
        const now = new Date();
        const hoursDiff = (now - saveDate) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          UIComponents.showToast(
            "Učitani su automatski sačuvani podaci",
            "info"
          );
          this.restoreFormState(app, data);
        } else {
          this.clearAutoSave(app.currentDate);
        }
      }
    } catch (error) {
      console.warn("Failed to load auto-save:", error);
      this.clearAutoSave(app.currentDate);
    }
  }

  restoreFormState(app, data) {
    if (data.currentMood) app.selectMood(data.currentMood);
    if (data.currentEnergy) {
      app.currentEnergy = data.currentEnergy;
      document.getElementById("energySlider").value = data.currentEnergy;
      document.getElementById("energyValue").textContent = data.currentEnergy;
    }
    if (data.selectedActivities) {
      data.selectedActivities.forEach((activity) => {
        app.selectedActivities.add(activity);
        document
          .querySelector(`[data-activity="${activity}"]`)
          ?.classList.add("selected");
      });
    }
    if (data.currentFeeling) app.selectFeeling(data.currentFeeling);
    if (data.bedTime) document.getElementById("bedTime").value = data.bedTime;
    if (data.wakeTime)
      document.getElementById("wakeTime").value = data.wakeTime;

    if (data.bedTime && data.wakeTime) {
      UIComponents.calculateSleepDuration();
    }
  }

  calculateFormProgress(app) {
    const totalFields = 4;
    let completedFields = 0;

    if (app.currentMood) completedFields++;
    if (app.currentEnergy && app.currentEnergy !== 5) completedFields++;
    if (
      document.getElementById("bedTime").value &&
      document.getElementById("wakeTime").value
    )
      completedFields++;
    if (app.selectedActivities.size > 0) completedFields++;

    const progress = (completedFields / totalFields) * 100;
    this.updateProgressIndicator(progress);
    return progress;
  }

  updateProgressIndicator(progress) {
    const progressBar = document.getElementById("formProgressBar");
    const progressText = document.getElementById("formProgressText");

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }

    if (progressText) {
      progressText.textContent = `${Math.round(progress)}% completed`;
    }
  }

  getValidationSummary() {
    return {
      hasErrors: this.formState.validationErrors.size > 0,
      errors: Array.from(this.formState.validationErrors.values()),
      errorCount: this.formState.validationErrors.size,
    };
  }

  markFormDirty() {
    this.formState.isDirty = true;
    this.showUnsavedChangesIndicator();
  }

  markFormClean() {
    this.formState.isDirty = false;
    this.hideUnsavedChangesIndicator();
  }

  showUnsavedChangesIndicator() {
    const indicator = document.getElementById("unsavedChanges");
    if (indicator) {
      indicator.classList.remove("hidden");
    }
  }

  hideUnsavedChangesIndicator() {
    const indicator = document.getElementById("unsavedChanges");
    if (indicator) {
      indicator.classList.add("hidden");
    }
  }

  setupBeforeUnloadWarning() {
    window.addEventListener("beforeunload", (e) => {
      if (this.formState.isDirty) {
        e.preventDefault();
        e.returnValue =
          "Imate nesačuvane izmene. Da li ste sigurni da želite da napustite stranicu?";
      }
    });
  }

  clearAutoSave(date) {
    localStorage.removeItem(`autosave_${date}`);
  }
}
