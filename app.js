class LifeTuner {
  constructor() {
    this.data = this.loadData();
    this.currentDate = new Date().toISOString().split("T")[0];
    this.currentSection = "dashboard";
    this.isFirstTime = !localStorage.getItem("lifetuner_visited");
    this.goals = this.loadGoals();
    this.reminders = this.loadReminders();

    this.ui = new UIManager(this);
    this.dataManager = new DataManager(this);
    this.analytics = new AnalyticsEngine(this);
    this.aiCoach = new AICoach(this);
    this.notifications = new NotificationManager(this);
    this.themeManager = new ThemeManager(this);
    this.reminderManager = new ReminderManager(this);
  }

  init() {
    this.setupEventListeners();
    this.ui.initializeInterface();
    this.loadCurrentDate();
    this.reminderManager.initReminders();

    if (this.isFirstTime) {
      setTimeout(() => this.showOnboarding(), 2000);
    }

    this.checkMissedDays();
    this.analytics.updateQuickStats();
    this.showDailyMotivation();
  }

  setupEventListeners() {
    document.querySelectorAll(".nav-btn, .nav-btn-mobile").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const section = e.currentTarget.dataset.section;
        this.switchSection(section);
      });
    });

    document.getElementById("dateSelector").addEventListener("change", (e) => {
      this.currentDate = e.target.value;
      this.loadDateData();
    });

    document.getElementById("prevDay").addEventListener("click", () => {
      this.changeDate(-1);
    });

    document.getElementById("nextDay").addEventListener("click", () => {
      this.changeDate(1);
    });

    this.setupFormEventListeners();

    document.getElementById("saveDayBtn").addEventListener("click", () => {
      this.saveDayData();
    });

    this.setupSettingsEventListeners();

    this.setupAIEventListeners();
  }

  setupFormEventListeners() {
    ["bedTime", "wakeTime"].forEach((id) => {
      document.getElementById(id).addEventListener("change", () => {
        this.calculateSleepDuration();
        this.updateProgress();
      });
    });

    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document
          .querySelectorAll(".mood-btn")
          .forEach((b) =>
            b.classList.remove("ring-4", "ring-primary", "ring-opacity-50")
          );
        e.currentTarget.classList.add(
          "ring-4",
          "ring-primary",
          "ring-opacity-50"
        );
        this.updateProgress();
      });
    });

    document.getElementById("energySlider").addEventListener("input", (e) => {
      document.getElementById("energyValue").textContent = e.target.value;
      this.updateProgress();
    });

    document.querySelectorAll(".activity-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.currentTarget.classList.toggle("ring-4");
        e.currentTarget.classList.toggle("ring-blue-400");
        e.currentTarget.classList.toggle("ring-opacity-50");
        this.updateProgress();
      });
    });
  }

  setupSettingsEventListeners() {
    document.getElementById("saveGoalsBtn").addEventListener("click", () => {
      this.saveGoals();
    });

    document.getElementById("exportData").addEventListener("click", () => {
      this.dataManager.exportJSON();
    });

    document.getElementById("exportCSV").addEventListener("click", () => {
      this.dataManager.exportCSV();
    });

    document.getElementById("clearData").addEventListener("click", () => {
      this.dataManager.clearAllData();
    });

    document
      .getElementById("saveRemindersBtn")
      .addEventListener("click", () => {
        this.saveReminders();
      });

    this.loadGoalsIntoForm();
    this.loadRemindersIntoForm();
  }

  setupAIEventListeners() {
    document.querySelectorAll(".feeling-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document
          .querySelectorAll(".feeling-btn")
          .forEach((b) =>
            b.classList.remove("ring-4", "ring-primary", "ring-opacity-50")
          );
        e.currentTarget.classList.add(
          "ring-4",
          "ring-primary",
          "ring-opacity-50"
        );
      });
    });

    document
      .getElementById("getRecommendations")
      .addEventListener("click", () => {
        this.aiCoach.generateRecommendations();
      });
  }

  switchSection(sectionName) {
    document.querySelectorAll("main > section").forEach((section) => {
      section.classList.add("hidden");
    });

    document.getElementById(sectionName).classList.remove("hidden");

    document.querySelectorAll(".nav-btn, .nav-btn-mobile").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelectorAll(`[data-section="${sectionName}"]`)
      .forEach((btn) => {
        btn.classList.add("active");
      });

    this.currentSection = sectionName;

    if (sectionName === "analytics") {
      this.analytics.renderCharts();
    }
  }

  loadCurrentDate() {
    document.getElementById("dateSelector").value = this.currentDate;
    this.loadDateData();
  }

  changeDate(days) {
    const date = new Date(this.currentDate);
    date.setDate(date.getDate() + days);
    this.currentDate = date.toISOString().split("T")[0];
    document.getElementById("dateSelector").value = this.currentDate;
    this.loadDateData();
  }

  loadDateData() {
    const dayData = this.data[this.currentDate] || {};

    if (dayData.bedTime)
      document.getElementById("bedTime").value = dayData.bedTime;
    if (dayData.wakeTime)
      document.getElementById("wakeTime").value = dayData.wakeTime;

    if (dayData.mood) {
      document.querySelectorAll(".mood-btn").forEach((btn) => {
        btn.classList.remove("ring-4", "ring-primary", "ring-opacity-50");
        if (btn.dataset.mood === dayData.mood.toString()) {
          btn.classList.add("ring-4", "ring-primary", "ring-opacity-50");
        }
      });
    }

    if (dayData.energy) {
      document.getElementById("energySlider").value = dayData.energy;
      document.getElementById("energyValue").textContent = dayData.energy;
    }

    document.querySelectorAll(".activity-btn").forEach((btn) => {
      btn.classList.remove("ring-4", "ring-blue-400", "ring-opacity-50");
      if (
        dayData.activities &&
        dayData.activities.includes(btn.dataset.activity)
      ) {
        btn.classList.add("ring-4", "ring-blue-400", "ring-opacity-50");
      }
    });

    this.calculateSleepDuration();
    this.updateProgress();
  }

  calculateSleepDuration() {
    const bedTime = document.getElementById("bedTime").value;
    const wakeTime = document.getElementById("wakeTime").value;

    if (bedTime && wakeTime) {
      const bed = new Date(`2000-01-01 ${bedTime}`);
      let wake = new Date(`2000-01-01 ${wakeTime}`);

      if (wake < bed) {
        wake.setDate(wake.getDate() + 1);
      }

      const diff = wake - bed;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      document.getElementById(
        "sleepDuration"
      ).textContent = `${hours}h ${minutes}m`;
    }
  }

  updateProgress() {
    const fields = ["bedTime", "wakeTime"];
    let completed = 0;
    let total = 5;

    if (document.getElementById("bedTime").value) completed++;
    if (document.getElementById("wakeTime").value) completed++;

    if (document.querySelector(".mood-btn.ring-4")) completed++;

    if (document.getElementById("energySlider").value !== "5") completed++;

    if (document.querySelector(".activity-btn.ring-4")) completed++;

    const percentage = Math.round((completed / total) * 100);

    const progressCircle = document.getElementById("progressCircle");
    const progressPercent = document.getElementById("progressPercent");
    const progressText = document.getElementById("formProgressText");

    if (progressCircle) {
      const circumference = 2 * Math.PI * 20;
      const offset = circumference - (percentage / 100) * circumference;
      progressCircle.style.strokeDashoffset = offset;

      progressPercent.textContent = `${percentage}%`;
      progressText.textContent = `${percentage}% completed`;

      const container = document.getElementById("formProgressContainer");
      if (percentage > 0 && percentage < 100) {
        container.classList.remove("hidden");
      } else {
        container.classList.add("hidden");
      }
    }
  }

  saveDayData() {
    const dayData = {
      bedTime: document.getElementById("bedTime").value,
      wakeTime: document.getElementById("wakeTime").value,
      mood: document.querySelector(".mood-btn.ring-4")?.dataset.mood,
      energy: document.getElementById("energySlider").value,
      activities: Array.from(
        document.querySelectorAll(".activity-btn.ring-4")
      ).map((btn) => btn.dataset.activity),
      timestamp: new Date().toISOString(),
    };

    if (
      !dayData.bedTime ||
      !dayData.wakeTime ||
      !dayData.mood ||
      !dayData.energy
    ) {
      this.notifications.show("Molimo popunite sva polja!", "error");
      return;
    }

    this.data[this.currentDate] = dayData;
    this.saveData();

    this.notifications.show("Podaci su uspešno sačuvani!", "success");

    const progress = this.calculateCompletionPercentage(dayData);
    if (progress >= 100) {
      setTimeout(() => this.showDayCompleteModal(), 500);
    }

    this.analytics.updateQuickStats();
  }

  calculateCompletionPercentage(dayData) {
    let completed = 0;
    if (dayData.bedTime) completed++;
    if (dayData.wakeTime) completed++;
    if (dayData.mood) completed++;
    if (dayData.energy) completed++;
    if (dayData.activities && dayData.activities.length > 0) completed++;

    return (completed / 5) * 100;
  }

  showDayCompleteModal() {
    document.getElementById("dayCompleteModal").classList.remove("hidden");

    document.getElementById("closeDayModal").onclick = () => {
      document.getElementById("dayCompleteModal").classList.add("hidden");
    };
  }

  showOnboarding() {
    const steps = [
      {
        title: "Dobrodošli u LifeTuner! 🎉",
        content:
          "Vaš lični asistent za praćenje navika i poboljšanje kvaliteta života.",
        icon: "fas fa-heart",
      },
      {
        title: "Dnevno praćenje 📊",
        content:
          "Svaki dan unesite podatke o snu, raspoloženju, energiji i aktivnostima.",
        icon: "fas fa-calendar-day",
      },
      {
        title: "Analitika i uvidi 📈",
        content:
          "Analizirajte svoje obrasce i otkrijte šta utiče na vaše blagostanje.",
        icon: "fas fa-chart-line",
      },
      {
        title: "AI lični trener 🤖",
        content:
          "Dobijajte personalizovane preporuke na osnovu vaših podataka.",
        icon: "fas fa-robot",
      },
    ];

    let currentStep = 0;
    const modal = document.getElementById("onboardingModal");
    const content = modal.querySelector("div > div");

    const showStep = (step) => {
      content.innerHTML = `
        <div class="text-center">
          <div class="w-20 h-20 bg-gradient-to-br from-primary to-purple rounded-full flex items-center justify-center mx-auto mb-6">
            <i class="${steps[step].icon} text-3xl text-white"></i>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">${
            steps[step].title
          }</h2>
          <p class="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">${
            steps[step].content
          }</p>
          <div class="flex justify-between items-center">
            <div class="flex space-x-2">
              ${steps
                .map(
                  (_, i) => `
                <div class="w-3 h-3 rounded-full ${
                  i === step ? "bg-primary" : "bg-gray-300"
                }"></div>
              `
                )
                .join("")}
            </div>
            <div class="space-x-3">
              ${
                step < steps.length - 1
                  ? `<button id="nextStep" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">Sledeće</button>`
                  : `<button id="finishOnboarding" class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors">Počnimo!</button>`
              }
            </div>
          </div>
        </div>
      `;

      if (step < steps.length - 1) {
        content.querySelector("#nextStep").onclick = () => showStep(step + 1);
      } else {
        content.querySelector("#finishOnboarding").onclick = () => {
          modal.classList.add("hidden");
          localStorage.setItem("lifetuner_visited", "true");
        };
      }
    };

    modal.classList.remove("hidden");
    showStep(0);
  }

  checkMissedDays() {
    const today = new Date();
    const lastEntry = Object.keys(this.data).sort().pop();

    if (lastEntry) {
      const lastDate = new Date(lastEntry);
      const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff >= 2) {
        setTimeout(() => {
          this.notifications.show(
            `Niste uneli podatke ${daysDiff} dana. Vratite se rutini! 💪`,
            "warning",
            5000
          );
        }, 3000);
      }
    }
  }

  saveGoals() {
    this.goals = {
      sleep: parseInt(document.getElementById("sleepGoal").value),
      energy: parseInt(document.getElementById("energyGoal").value),
      exercise: parseInt(document.getElementById("exerciseGoal").value),
      mood: parseInt(document.getElementById("moodGoal").value),
    };

    localStorage.setItem("lifetuner_goals", JSON.stringify(this.goals));
    this.notifications.show("Ciljevi su sačuvani!", "success");
  }

  saveReminders() {
    this.reminders = {
      enabled: document.getElementById("remindersEnabled").checked,
      morningTime: document.getElementById("morningReminder").value,
      eveningTime: document.getElementById("eveningReminder").value,
      frequency: document.getElementById("reminderFrequency").value,
    };

    localStorage.setItem("lifetuner_reminders", JSON.stringify(this.reminders));
    this.notifications.show("Podsetnici su sačuvani!", "success");

    if (this.reminders.enabled) {
      this.reminderManager.scheduleReminders();
    }
  }

  loadGoals() {
    const saved = localStorage.getItem("lifetuner_goals");
    return saved
      ? JSON.parse(saved)
      : {
          sleep: 8,
          energy: 7,
          exercise: 3,
          mood: 4,
        };
  }

  loadReminders() {
    const saved = localStorage.getItem("lifetuner_reminders");
    return saved
      ? JSON.parse(saved)
      : {
          enabled: false,
          morningTime: "09:00",
          eveningTime: "21:00",
          frequency: "daily",
        };
  }

  loadGoalsIntoForm() {
    document.getElementById("sleepGoal").value = this.goals.sleep;
    document.getElementById("energyGoal").value = this.goals.energy;
    document.getElementById("exerciseGoal").value = this.goals.exercise;
    document.getElementById("moodGoal").value = this.goals.mood;
  }

  loadRemindersIntoForm() {
    document.getElementById("remindersEnabled").checked =
      this.reminders.enabled;
    document.getElementById("morningReminder").value =
      this.reminders.morningTime;
    document.getElementById("eveningReminder").value =
      this.reminders.eveningTime;
    document.getElementById("reminderFrequency").value =
      this.reminders.frequency;
  }

  showDailyMotivation() {
    const motivationalQuotes = [
      "Svaki novi dan je prilika da postanete bolja verzija sebe. 🌟",
      "Male, svakodnevne navike stvaraju velike promene. 🚀",
      "Progres je progres, bez obzira koliko mali. 📈",
      "Vaše zdravlje je investicija, ne trošak. 💎",
      "Slušajte svoje telo - ono zna šta mu treba. 🧘‍♀️",
      "Balans nije savršenstvo, već prilagođavanje. ⚖️",
      "Budite strpljivi sa sobom tokom putovanja ka boljim navikama. 🌱",
    ];

    const today = new Date();
    const dayOfYear = Math.floor(
      (today - new Date(today.getFullYear(), 0, 0)) / 86400000
    );
    const quote = motivationalQuotes[dayOfYear % motivationalQuotes.length];

    const element = document.getElementById("dailyMotivationWidget");
    if (element) {
      element.innerHTML = `
        <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 shadow-lg">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <i class="fas fa-lightbulb text-2xl"></i>
            </div>
            <div>
              <h3 class="font-bold text-lg">Dnevna motivacija</h3>
              <p class="text-sm opacity-90">${today.toLocaleDateString(
                "sr-RS",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}</p>
            </div>
          </div>
          <p class="text-lg leading-relaxed italic">"${quote}"</p>
        </div>
      `;
    }
  }

  loadData() {
    const saved = localStorage.getItem("lifetuner_data");
    return saved ? JSON.parse(saved) : {};
  }

  saveData() {
    localStorage.setItem("lifetuner_data", JSON.stringify(this.data));
  }
}

class ReminderManager {
  constructor(app) {
    this.app = app;
    this.timeouts = [];
  }

  initReminders() {
    if (this.app.reminders.enabled) {
      this.scheduleReminders();
    }
  }

  scheduleReminders() {
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts = [];

    if (!this.app.reminders.enabled) return;

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const morningTime = new Date(`${today}T${this.app.reminders.morningTime}`);
    if (morningTime > now) {
      const timeout = setTimeout(() => {
        this.showReminder(
          "Dobro jutro! 🌅",
          "Vreme je da unesete jutarnje podatke o raspoloženju i energiji."
        );
      }, morningTime - now);
      this.timeouts.push(timeout);
    }

    const eveningTime = new Date(`${today}T${this.app.reminders.eveningTime}`);
    if (eveningTime > now) {
      const timeout = setTimeout(() => {
        this.showReminder(
          "Dobro veče! 🌙",
          "Ne zaboravite da završite dnevni tracker pre spavanja."
        );
      }, eveningTime - now);
      this.timeouts.push(timeout);
    }

    setTimeout(() => {
      this.scheduleReminders();
    }, 24 * 60 * 60 * 1000);
  }

  showReminder(title, message) {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: "/favicon.ico",
        tag: "lifetuner-reminder",
      });
    }

    this.app.notifications.show(`${title} ${message}`, "info", 8000);
  }

  requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          this.app.notifications.show(
            "Notifikacije su omogućene! 🔔",
            "success"
          );
        }
      });
    }
  }
}

class UIManager {
  constructor(app) {
    this.app = app;
  }

  initializeInterface() {
    this.setupThemeToggle();
    this.setupMobileOptimizations();
    this.addCustomStyles();
    this.setupProgressAnimations();
    this.setupTooltips();
  }

  setupThemeToggle() {
    const toggles = document.querySelectorAll("#darkModeToggle, #themeToggle");
    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        this.app.themeManager.toggle();
      });
    });
  }

  setupMobileOptimizations() {
    document
      .querySelectorAll("button, .mood-btn, .activity-btn")
      .forEach((el) => {
        el.style.minHeight = "44px";
        el.style.minWidth = "44px";
      });

    const viewport = document.querySelector("meta[name=viewport]");
    if (viewport) {
      viewport.setAttribute(
        "content",
        viewport.getAttribute("content") + ", user-scalable=no"
      );
    }
  }

  setupProgressAnimations() {
    const progressCircles = document.querySelectorAll(".progress-circle");
    progressCircles.forEach((circle) => {
      const progress = circle.dataset.progress || 0;
      const circumference = 2 * Math.PI * 20;
      const offset = circumference - (progress / 100) * circumference;

      circle.style.strokeDasharray = circumference;
      circle.style.strokeDashoffset = circumference;

      setTimeout(() => {
        circle.style.transition = "stroke-dashoffset 1s ease-in-out";
        circle.style.strokeDashoffset = offset;
      }, 500);
    });
  }

  setupTooltips() {
    document.querySelectorAll("[data-tooltip]").forEach((element) => {
      element.addEventListener("mouseenter", (e) => {
        const tooltip = document.createElement("div");
        tooltip.className =
          "absolute z-50 bg-gray-900 text-white text-sm px-2 py-1 rounded shadow-lg pointer-events-none";
        tooltip.textContent = e.target.dataset.tooltip;

        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = rect.left + "px";
        tooltip.style.top = rect.top - 35 + "px";

        document.body.appendChild(tooltip);
        e.target._tooltip = tooltip;
      });

      element.addEventListener("mouseleave", (e) => {
        if (e.target._tooltip) {
          document.body.removeChild(e.target._tooltip);
          delete e.target._tooltip;
        }
      });
    });
  }

  addCustomStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .nav-btn.active {
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
      }
      
      .nav-btn-mobile.active {
        color: #6366F1;
        transform: scale(1.1);
      }
      
      .feeling-btn.active,
      .mood-btn.active,
      .activity-btn.active {
        transform: scale(1.05);
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
      }
      
      input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        transition: all 0.2s ease;
      }
      
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
      }
      
      .hover-lift {
        transition: all 0.3s ease;
      }
      
      .hover-lift:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      }
      
      .pulse-animation {
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      .slide-in {
        animation: slideIn 0.5s ease-out;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .fade-in {
        animation: fadeIn 0.6s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .progress-circle {
        transform-origin: center;
        transition: stroke-dashoffset 1s ease-in-out;
      }
      
      @media (max-width: 768px) {
        .hover-lift:hover {
          transform: none;
        }
        
        .nav-btn.active {
          transform: none;
        }
      }
      
      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 6px;
      }
      
      ::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
        border-radius: 3px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #5B5EE7, #7C3AED);
      }
    `;
    document.head.appendChild(style);
  }
}

class DataManager {
  constructor(app) {
    this.app = app;
  }

  exportJSON() {
    const data = {
      appName: "LifeTuner",
      version: "1.0.0",
      data: this.app.data,
      goals: this.app.goals,
      reminders: this.app.reminders,
      exportDate: new Date().toISOString(),
      totalEntries: Object.keys(this.app.data).length,
      dateRange: this.getDateRange(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    this.downloadFile(
      blob,
      `lifetuner-data-${new Date().toISOString().split("T")[0]}.json`
    );

    this.app.notifications.show(
      "📊 Podaci su uspešno izvezeni u JSON formatu!",
      "success"
    );
  }

  exportCSV() {
    const headers = [
      "Datum",
      "Dan u nedelji",
      "Spavanje",
      "Buđenje",
      "Sati sna",
      "Raspoloženje",
      "Energija",
      "Aktivnosti",
      "Broj aktivnosti",
    ];
    const rows = [headers];

    Object.entries(this.app.data).forEach(([date, data]) => {
      const sleepHours = this.calculateSleepHours(data.bedTime, data.wakeTime);
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.toLocaleDateString("sr-RS", {
        weekday: "long",
      });

      const row = [
        date,
        dayOfWeek,
        data.bedTime || "",
        data.wakeTime || "",
        sleepHours || "",
        data.mood || "",
        data.energy || "",
        (data.activities || []).join("; "),
        (data.activities || []).length,
      ];
      rows.push(row);
    });

    const csv = rows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    this.downloadFile(
      blob,
      `lifetuner-data-${new Date().toISOString().split("T")[0]}.csv`
    );

    this.app.notifications.show(
      "📈 Podaci su uspešno izvezeni u CSV formatu!",
      "success"
    );
  }

  getDateRange() {
    const dates = Object.keys(this.app.data).sort();
    if (dates.length === 0) return null;

    return {
      from: dates[0],
      to: dates[dates.length - 1],
      totalDays: dates.length,
    };
  }

  calculateSleepHours(bedTime, wakeTime) {
    if (!bedTime || !wakeTime) return "";

    const bed = new Date(`2000-01-01 ${bedTime}`);
    let wake = new Date(`2000-01-01 ${wakeTime}`);

    if (wake < bed) {
      wake.setDate(wake.getDate() + 1);
    }

    const diff = wake - bed;
    const hours = diff / (1000 * 60 * 60);
    return hours.toFixed(1);
  }

  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clearAllData() {
    const confirmModal = document.createElement("div");
    confirmModal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";
    confirmModal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Obriši sve podatke?</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          Ova akcija će trajno obrisati sve vaše podatke, ciljeve i podešavanja. 
          Preporučujemo da prethodno eksportujete podatke.
        </p>
        <div class="flex space-x-3">
          <button id="cancelDelete" class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            Otkaži
          </button>
          <button id="confirmDelete" class="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
            Obriši sve
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(confirmModal);

    document.getElementById("cancelDelete").onclick = () => {
      document.body.removeChild(confirmModal);
    };

    document.getElementById("confirmDelete").onclick = () => {
      localStorage.removeItem("lifetuner_data");
      localStorage.removeItem("lifetuner_goals");
      localStorage.removeItem("lifetuner_visited");
      localStorage.removeItem("lifetuner_reminders");
      localStorage.removeItem("lifetuner_theme");

      this.app.data = {};
      this.app.goals = this.app.loadGoals();
      this.app.reminders = this.app.loadReminders();

      this.app.notifications.show(
        "🗑️ Svi podaci su uspešno obrisani!",
        "success"
      );

      setTimeout(() => {
        location.reload();
      }, 1500);
    };
  }
}

class AnalyticsEngine {
  constructor(app) {
    this.app = app;
    this.charts = {};
  }

  updateQuickStats() {
    const recentData = this.getRecentData(7);

    const streak = this.calculateStreak();
    document.getElementById("streakCounter").textContent = streak;

    const avgEnergy = this.calculateAverage(recentData, "energy");
    document.getElementById("avgEnergyQuick").textContent =
      avgEnergy.toFixed(1);

    const avgSleep = this.calculateAverageSleep(recentData);
    document.getElementById("avgSleepQuick").textContent = avgSleep;

    const commonMood = this.getMostCommonMood(recentData);
    document.getElementById("avgMoodQuick").textContent = commonMood;
  }

  getRecentData(days) {
    const recent = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      if (this.app.data[dateStr]) {
        recent.push({ date: dateStr, ...this.app.data[dateStr] });
      }
    }

    return recent.reverse();
  }

  calculateStreak() {
    const dates = Object.keys(this.app.data).sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];

    if (this.app.data[today]) {
      streak = 1;

      for (let i = 1; i < dates.length; i++) {
        const currentDate = new Date(dates[i - 1]);
        const prevDate = new Date(dates[i]);
        const daysDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);

        if (daysDiff === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    return streak;
  }

  calculateAverage(data, field) {
    const values = data
      .filter((d) => d[field])
      .map((d) => parseFloat(d[field]));
    return values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
  }

  calculateAverageSleep(data) {
    const sleepHours = data
      .filter((d) => d.bedTime && d.wakeTime)
      .map((d) => {
        const bed = new Date(`2000-01-01 ${d.bedTime}`);
        let wake = new Date(`2000-01-01 ${d.wakeTime}`);

        if (wake < bed) {
          wake.setDate(wake.getDate() + 1);
        }

        return (wake - bed) / (1000 * 60 * 60);
      });

    if (sleepHours.length === 0) return "0h 0m";

    const avg = sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length;
    const hours = Math.floor(avg);
    const minutes = Math.round((avg - hours) * 60);

    return `${hours}h ${minutes}m`;
  }

  getMostCommonMood(data) {
    const moods = data.filter((d) => d.mood).map((d) => parseInt(d.mood));
    if (moods.length === 0) return "😐";

    const moodEmojis = { 1: "😢", 2: "😕", 3: "😐", 4: "😊", 5: "😄" };
    const moodCounts = {};

    moods.forEach((mood) => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });

    const mostCommon = Object.keys(moodCounts).reduce((a, b) =>
      moodCounts[a] > moodCounts[b] ? a : b
    );

    return moodEmojis[mostCommon];
  }

  renderCharts() {
    if (typeof Chart === "undefined") return;

    const recentData = this.getRecentData(7);

    this.renderEnergyChart(recentData);
    this.renderMoodChart(recentData);
    this.renderActivitiesChart();
    this.renderTimeEnergyChart(recentData);
    this.generateInsights(recentData);
  }

  renderEnergyChart(data) {
    const ctx = document.getElementById("energyChart");
    if (!ctx) return;

    if (this.charts.energy) {
      this.charts.energy.destroy();
    }

    this.charts.energy = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) =>
          new Date(d.date).toLocaleDateString("sr-RS", { weekday: "short" })
        ),
        datasets: [
          {
            label: "Energija",
            data: data.map((d) => d.energy || 0),
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
          },
        },
      },
    });
  }

  renderMoodChart(data) {
    const ctx = document.getElementById("moodChart");
    if (!ctx) return;

    if (this.charts.mood) {
      this.charts.mood.destroy();
    }

    this.charts.mood = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((d) =>
          new Date(d.date).toLocaleDateString("sr-RS", { weekday: "short" })
        ),
        datasets: [
          {
            label: "Raspoloženje",
            data: data.map((d) => d.mood || 0),
            backgroundColor: [
              "#EF4444", // red
              "#F97316", // orange
              "#6B7280", // gray
              "#10B981", // green
              "#F59E0B", // yellow
            ].slice(0, data.length),
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
          },
        },
      },
    });
  }

  renderActivitiesChart() {
    const ctx = document.getElementById("activitiesChart");
    if (!ctx) return;

    if (this.charts.activities) {
      this.charts.activities.destroy();
    }

    const activityCounts = {};
    Object.values(this.app.data).forEach((day) => {
      if (day.activities) {
        day.activities.forEach((activity) => {
          activityCounts[activity] = (activityCounts[activity] || 0) + 1;
        });
      }
    });

    const sortedActivities = Object.entries(activityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

    this.charts.activities = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: sortedActivities.map(([activity]) =>
          this.translateActivity(activity)
        ),
        datasets: [
          {
            data: sortedActivities.map(([, count]) => count),
            backgroundColor: [
              "#6366F1",
              "#8B5CF6",
              "#EC4899",
              "#10B981",
              "#F59E0B",
              "#EF4444",
              "#06B6D4",
              "#84CC16",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }

  renderTimeEnergyChart(data) {
    const ctx = document.getElementById("timeEnergyChart");
    if (!ctx) return;

    if (this.charts.timeEnergy) {
      this.charts.timeEnergy.destroy();
    }

    const hourlyData = [
      6, 7, 8, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 5, 6, 7, 7.5, 8, 8.5, 8,
      7.5, 7, 6.5, 6,
    ];

    this.charts.timeEnergy = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [
          {
            label: "Energija po satima",
            data: hourlyData,
            borderColor: "#8B5CF6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
          },
        },
      },
    });
  }

  translateActivity(activity) {
    const translations = {
      exercise: "Vežbanje",
      coffee: "Kafa",
      social: "Druženje",
      work: "Rad",
      reading: "Čitanje",
      meditation: "Meditacija",
      walk: "Šetnja",
      screen: "Ekran",
    };
    return translations[activity] || activity;
  }

  generateInsights(data) {
    const insights = [];

    const avgSleepHours = data
      .filter((d) => d.bedTime && d.wakeTime)
      .map((d) => {
        const bed = new Date(`2000-01-01 ${d.bedTime}`);
        let wake = new Date(`2000-01-01 ${d.wakeTime}`);
        if (wake < bed) wake.setDate(wake.getDate() + 1);
        return (wake - bed) / (1000 * 60 * 60);
      });

    if (avgSleepHours.length > 0) {
      const avg =
        avgSleepHours.reduce((a, b) => a + b, 0) / avgSleepHours.length;
      if (avg < 7) {
        insights.push({
          icon: "fas fa-bed text-blue-500",
          text: "Prosečno spavate manje od preporučenih 7-9 sati. Pokušajte da idete ranije u krevet.",
        });
      }
    }

    const avgEnergy = this.calculateAverage(data, "energy");
    if (avgEnergy < 6) {
      insights.push({
        icon: "fas fa-bolt text-yellow-500",
        text: "Vaš nivo energije je nizak. Razmislite o većoj fizičkoj aktivnosti i zdravijoj ishrani.",
      });
    }

    const hasExercise = data.some(
      (d) => d.activities && d.activities.includes("exercise")
    );
    if (!hasExercise) {
      insights.push({
        icon: "fas fa-dumbbell text-red-500",
        text: "Niste vežbali u poslednjih 7 dana. Fizička aktivnost poboljšava energiju i raspoloženje.",
      });
    }

    const container = document.getElementById("insights");
    if (container) {
      container.innerHTML = insights
        .map(
          (insight) => `
        <div class="flex items-start space-x-3 p-4 bg-white bg-opacity-10 rounded-xl">
          <i class="${insight.icon} text-xl mt-1"></i>
          <p class="text-white">${insight.text}</p>
        </div>
      `
        )
        .join("");
    }
  }
}

class AICoach {
  constructor(app) {
    this.app = app;
    this.recommendations = {
      tired: [
        {
          title: "Kratka šetnja",
          icon: "fas fa-walking",
          description: "Svež vazduh će vam pomoći",
        },
        {
          title: "10min meditacija",
          icon: "fas fa-leaf",
          description: "Opustite um i telo",
        },
        {
          title: "Hydratacija",
          icon: "fas fa-tint",
          description: "Popijte čašu vode",
        },
      ],
      stressed: [
        {
          title: "Duboko disanje",
          icon: "fas fa-wind",
          description: "4-7-8 tehnika disanja",
        },
        {
          title: "Organize to-do",
          icon: "fas fa-list",
          description: "Napravite prioritete",
        },
        {
          title: "Pozovite prijatelja",
          icon: "fas fa-phone",
          description: "Podelite kako se osećate",
        },
      ],
      energetic: [
        {
          title: "Vežbanje",
          icon: "fas fa-dumbbell",
          description: "Iskoristite energiju",
        },
        {
          title: "Kreativni projekat",
          icon: "fas fa-paint-brush",
          description: "Fokusirajte kreativnost",
        },
        {
          title: "Učenje nečeg novog",
          icon: "fas fa-book",
          description: "Proširite znanje",
        },
      ],
      unfocused: [
        {
          title: "Pomodoro tehnika",
          icon: "fas fa-clock",
          description: "25min fokus + 5min pauza",
        },
        {
          title: "Uklonite distrakcije",
          icon: "fas fa-mobile-alt",
          description: "Stavite telefon u drugi režim",
        },
        {
          title: "Promena okruženja",
          icon: "fas fa-home",
          description: "Promenite mesto rada",
        },
      ],
    };

    this.motivationalQuotes = [
      "Svaki novi dan je prilika da postanete bolja verzija sebe.",
      "Male, svakodnevne navike stvaraju velike promene.",
      "Progres je progres, bez obzira koliko mali.",
      "Vaše zdravlje je investicija, ne trošak.",
      "Slušajte svoje telo - ono zna šta mu treba.",
      "Balans nije savršenstvo, već prilagođavanje.",
      "Budite strpljivi sa sobom tokom putovanja ka boljim navikama.",
    ];
  }

  generateRecommendations() {
    const selectedFeeling = document.querySelector(".feeling-btn.ring-4");
    if (!selectedFeeling) {
      this.app.notifications.show(
        "Molimo izaberite kako se osećate!",
        "warning"
      );
      return;
    }

    const feeling = selectedFeeling.dataset.feeling;
    const recommendations = this.recommendations[feeling] || [];

    this.displayRecommendations(recommendations);
    this.updateDailyMotivation();
  }

  displayRecommendations(recommendations) {
    const container = document.getElementById("recommendations");
    const containerWrapper = document.getElementById(
      "recommendationsContainer"
    );

    if (!container || !containerWrapper) return;

    container.innerHTML = recommendations
      .map(
        (rec) => `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 hover-lift transition-all duration-300">
        <div class="text-center">
          <div class="w-16 h-16 bg-gradient-to-br from-primary to-purple rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i class="${rec.icon} text-2xl text-white"></i>
          </div>
          <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-2">${rec.title}</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">${rec.description}</p>
          <button class="mt-4 bg-gradient-to-r from-primary to-purple text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300">
            Pokušaj sada
          </button>
        </div>
      </div>
    `
      )
      .join("");

    containerWrapper.classList.remove("hidden");
    this.app.notifications.show("Evo preporuka za vas! ✨", "success");
  }

  updateDailyMotivation() {
    const quote =
      this.motivationalQuotes[
        Math.floor(Math.random() * this.motivationalQuotes.length)
      ];
    const element = document.getElementById("dailyMotivation");
    if (element) {
      element.textContent = `"${quote}"`;
    }
  }
}

class NotificationManager {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById("toastContainer");
  }

  show(message, type = "info", duration = 3000) {
    const toast = this.createToast(message, type);
    this.container.appendChild(toast);

    setTimeout(() => toast.classList.add("translate-x-0", "opacity-100"), 100);

    setTimeout(() => this.remove(toast), duration);

    toast.addEventListener("click", () => this.remove(toast));
  }

  createToast(message, type) {
    const toast = document.createElement("div");
    toast.className = `transform translate-x-full opacity-0 transition-all duration-300 p-4 rounded-xl shadow-lg border max-w-sm cursor-pointer`;

    const colors = {
      success: "bg-green-500 border-green-400 text-white",
      error: "bg-red-500 border-red-400 text-white",
      warning: "bg-yellow-500 border-yellow-400 text-white",
      info: "bg-blue-500 border-blue-400 text-white",
    };

    const icons = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    };

    toast.className += ` ${colors[type] || colors.info}`;

    toast.innerHTML = `
      <div class="flex items-center space-x-3">
        <i class="${icons[type] || icons.info}"></i>
        <span class="font-medium">${message}</span>
      </div>
    `;

    return toast;
  }

  remove(toast) {
    toast.classList.add("translate-x-full", "opacity-0");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

class ThemeManager {
  constructor(app) {
    this.app = app;
    this.isDark = localStorage.getItem("lifetuner_theme") === "dark";
    this.apply();
  }

  toggle() {
    this.isDark = !this.isDark;
    this.apply();
    this.save();
  }

  apply() {
    if (this.isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  save() {
    localStorage.setItem("lifetuner_theme", this.isDark ? "dark" : "light");
  }
}

window.LifeTuner = LifeTuner;
