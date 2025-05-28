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

    this.goals = {
      sleepHours: parseInt(sleepGoal),
      minEnergy: parseInt(energyGoal),
      exerciseFrequency: parseInt(exerciseGoal),
      moodTarget: parseInt(moodGoal),
    };

    localStorage.setItem("lifetuner_goals", JSON.stringify(this.goals));
    UIComponents.showToast("Ciljevi su sačuvani!", "success");
    return this.goals;
  }

  checkGoalProgress() {
    const allData = DataManager.getAllData();
    const last7Days = DataManager.getLast7Days(allData);
    const progress = {
      sleep: 0,
      energy: 0,
      exercise: 0,
      mood: 0,
    };

    const sleepData = last7Days.filter((d) => d.sleep && d.sleep.duration);
    if (sleepData.length > 0) {
      const avgSleep =
        sleepData.reduce(
          (sum, d) => sum + DataManager.parseSleepDuration(d.sleep.duration),
          0
        ) / sleepData.length;
      progress.sleep = Math.min(100, (avgSleep / this.goals.sleepHours) * 100);
    }

    const energyData = last7Days.filter((d) => d.energy);
    if (energyData.length > 0) {
      const highEnergyDays = energyData.filter(
        (d) => d.energy >= this.goals.minEnergy
      ).length;
      progress.energy = (highEnergyDays / energyData.length) * 100;
    }

    const exerciseCount = last7Days.filter(
      (d) => d.activities && d.activities.includes("exercise")
    ).length;
    progress.exercise = Math.min(
      100,
      (exerciseCount / this.goals.exerciseFrequency) * 100
    );

    const moodData = last7Days.filter((d) => d.mood);
    if (moodData.length > 0) {
      const goodMoodDays = moodData.filter(
        (d) => d.mood >= this.goals.moodTarget
      ).length;
      progress.mood = (goodMoodDays / moodData.length) * 100;
    }

    this.updateProgressUI(progress);
    return progress;
  }

  updateProgressUI(progress) {
    UIComponents.updateProgressBar(
      "sleepProgress",
      progress.sleep,
      `${progress.sleep.toFixed(1)}% od cilja`
    );
    UIComponents.updateProgressBar(
      "energyProgress",
      progress.energy,
      `${progress.energy.toFixed(1)}% od cilja`
    );
    UIComponents.updateProgressBar(
      "exerciseProgress",
      progress.exercise,
      `${progress.exercise.toFixed(1)}% od cilja`
    );
    UIComponents.updateProgressBar(
      "moodProgress",
      progress.mood,
      `${progress.mood.toFixed(1)}% od cilja`
    );
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
