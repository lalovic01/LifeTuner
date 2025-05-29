import { DataManager } from "./data-manager.js";
import { UIComponents } from "./ui-components.js";

export class GoalTracker {
  constructor() {
    this.goals = {
      sleepHours: 8,
      minEnergy: 7,
      exerciseFrequency: 3,
      moodTarget: 4,
    };
    this.currentStreak = 0;
    this.longestStreak = 0;
  }

  loadGoals() {
    const savedGoals = localStorage.getItem("lifetuner_goals");
    if (savedGoals) {
      this.goals = { ...this.goals, ...JSON.parse(savedGoals) };
    }
    this.updateGoalsUI();
  }

  updateGoalsUI() {
    const sleepGoalEl = document.getElementById("sleepGoal");
    const energyGoalEl = document.getElementById("energyGoal");
    const exerciseGoalEl = document.getElementById("exerciseGoal");
    const moodGoalEl = document.getElementById("moodGoal");

    if (sleepGoalEl) sleepGoalEl.value = this.goals.sleepHours;
    if (energyGoalEl) energyGoalEl.value = this.goals.minEnergy;
    if (exerciseGoalEl) exerciseGoalEl.value = this.goals.exerciseFrequency;
    if (moodGoalEl) moodGoalEl.value = this.goals.moodTarget;
  }

  saveGoals() {
    const sleepGoal = document.getElementById("sleepGoal")?.value || 8;
    const energyGoal = document.getElementById("energyGoal")?.value || 7;
    const exerciseGoal = document.getElementById("exerciseGoal")?.value || 3;
    const moodGoal = document.getElementById("moodGoal")?.value || 4;

    if (sleepGoal < 6 || sleepGoal > 12) {
      UIComponents.showToast("San mora biti između 6 i 12 sati!", "error");
      return false;
    }

    if (energyGoal < 1 || energyGoal > 10) {
      UIComponents.showToast("Energija mora biti između 1 i 10!", "error");
      return false;
    }

    if (exerciseGoal < 1 || exerciseGoal > 7) {
      UIComponents.showToast(
        "Vežbanje mora biti između 1 i 7 puta nedeljno!",
        "error"
      );
      return false;
    }

    if (moodGoal < 1 || moodGoal > 5) {
      UIComponents.showToast("Raspoloženje mora biti između 1 i 5!", "error");
      return false;
    }

    this.goals = {
      sleepHours: parseInt(sleepGoal),
      minEnergy: parseInt(energyGoal),
      exerciseFrequency: parseInt(exerciseGoal),
      moodTarget: parseInt(moodGoal),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("lifetuner_goals", JSON.stringify(this.goals));
    UIComponents.showToast("Ciljevi su uspešno sačuvani!", "success");

    this.updateGoalProgress();
    return this.goals;
  }

  updateGoalProgress() {
    const recentData = this.getRecentWeekData();
    const progress = this.calculateWeeklyProgress(recentData);

    this.displayGoalProgress(progress);
  }

  getRecentWeekData() {
    const data = JSON.parse(localStorage.getItem("lifeTunerData") || "{}");
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentEntries = Object.entries(data)
      .filter(([date]) => new Date(date) >= weekAgo)
      .map(([date, entry]) => ({ date, ...entry }));

    return recentEntries;
  }

  calculateWeeklyProgress(data) {
    if (!data.length) return { sleep: 0, energy: 0, exercise: 0, mood: 0 };

    const sleepGoal = this.goals.sleepHours;
    const energyGoal = this.goals.minEnergy;
    const exerciseGoal = this.goals.exerciseFrequency;
    const moodGoal = this.goals.moodTarget;

    const avgSleep =
      data.reduce((sum, day) => {
        if (day.bedTime && day.wakeTime) {
          const sleepHours = this.calculateSleepHours(
            day.bedTime,
            day.wakeTime
          );
          return sum + sleepHours;
        }
        return sum;
      }, 0) / data.length;

    const avgEnergy =
      data.reduce((sum, day) => sum + (day.energy || 0), 0) / data.length;

    const exerciseCount = data.filter(
      (day) => day.activities && day.activities.includes("exercise")
    ).length;

    const avgMood =
      data.reduce((sum, day) => sum + (day.mood || 0), 0) / data.length;

    return {
      sleep: Math.min(100, (avgSleep / sleepGoal) * 100),
      energy: Math.min(100, (avgEnergy / energyGoal) * 100),
      exercise: Math.min(100, (exerciseCount / exerciseGoal) * 100),
      mood: Math.min(100, (avgMood / moodGoal) * 100),
    };
  }

  calculateSleepHours(bedTime, wakeTime) {
    const bed = new Date(`2000-01-01 ${bedTime}`);
    let wake = new Date(`2000-01-01 ${wakeTime}`);

    if (wake < bed) {
      wake.setDate(wake.getDate() + 1);
    }

    return (wake - bed) / (1000 * 60 * 60);
  }

  displayGoalProgress(progress) {
    const container = document.getElementById("goalProgress");
    if (!container) return;

    container.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${Object.entries(progress)
          .map(
            ([key, value]) => `
          <div class="text-center">
            <div class="relative w-16 h-16 mx-auto mb-2">
              <svg class="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="transparent" class="text-gray-200"/>
                <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="transparent" 
                        class="text-primary" stroke-linecap="round"
                        stroke-dasharray="175.9" stroke-dashoffset="${
                          175.9 - (value / 100) * 175.9
                        }"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-xs font-bold">${Math.round(value)}%</span>
              </div>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400 capitalize">${key}</p>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  checkGoalProgress() {
    const recentData = this.getRecentWeekData();
    const progress = this.calculateWeeklyProgress(recentData);

    Object.entries(progress).forEach(([goal, percentage]) => {
      if (percentage >= 100) {
        UIComponents.showToast(
          `🎉 Ostvarili ste cilj za ${goal}!`,
          "success",
          5000
        );
      } else if (percentage >= 80) {
        UIComponents.showToast(
          `💪 Blizu ste cilja za ${goal} (${Math.round(percentage)}%)!`,
          "info",
          4000
        );
      }
    });

    return progress;
  }

  updateStreakCounter() {
    const allData = DataManager.getAllData();
    const today = new Date();
    let currentStreak = 0;
    let longestStreak = 0;

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      if (allData[dateStr] && allData[dateStr].completed) {
        if (i === 0 || currentStreak > 0) {
          currentStreak++;
        }
      } else if (i === 0) {
        break;
      } else {
        break;
      }
    }

    const dates = Object.keys(allData).sort();
    let tempStreak = 0;

    for (let i = 0; i < dates.length; i++) {
      if (allData[dates[i]].completed) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    this.currentStreak = currentStreak;
    this.longestStreak = longestStreak;

    const streakEl = document.getElementById("streakCounter");
    const longestStreakEl = document.getElementById("longestStreak");

    if (streakEl) streakEl.textContent = currentStreak;
    if (longestStreakEl) longestStreakEl.textContent = longestStreak;

    localStorage.setItem(
      "lifetuner_streak",
      JSON.stringify({
        current: currentStreak,
        longest: longestStreak,
      })
    );

    return { current: currentStreak, longest: longestStreak };
  }
}
