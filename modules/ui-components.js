export class UIComponents {
  static showToast(message, type = "info", duration = 3000) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");

    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      warning: "bg-yellow-500",
      info: "bg-blue-500",
    };

    toast.className = `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("translate-x-full");
    }, 100);

    setTimeout(() => {
      toast.classList.add("translate-x-full");
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  static showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  static hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  static calculateSleepDuration() {
    const bedTime = document.getElementById("bedTime").value;
    const wakeTime = document.getElementById("wakeTime").value;

    if (bedTime && wakeTime) {
      const bed = new Date(`2000-01-01T${bedTime}:00`);
      let wake = new Date(`2000-01-01T${wakeTime}:00`);

      if (wake < bed) {
        wake.setDate(wake.getDate() + 1);
      }

      const diffMs = wake - bed;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      document.getElementById(
        "sleepDuration"
      ).textContent = `${hours}h ${minutes}m`;
    }
  }

  static updateProgressBar(elementId, progress, tooltip) {
    const progressEl = document.getElementById(elementId);
    if (progressEl) {
      progressEl.style.width = `${progress}%`;
      if (tooltip) {
        progressEl.parentElement.setAttribute("data-tooltip", tooltip);
      }
    }
  }
}
