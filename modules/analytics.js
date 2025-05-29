import { DataManager } from "./data-manager.js";

export class Analytics {
  constructor() {
    this.charts = {
      energy: null,
      mood: null,
      activities: null,
      timeEnergy: null,
    };
  }

  loadAnalytics() {
    const allData = DataManager.getAllData();
    const days = Object.values(allData);

    if (days.length === 0) {
      this.showEmptyAnalytics();
      return;
    }

    this.updateStats(days);
    this.createCharts(days);
    this.generateInsights(days);
    this.analyzeTimeBasedPatterns(days);
  }

  showEmptyAnalytics() {
    document.getElementById("avgSleep").textContent = "N/A";
    document.getElementById("avgEnergy").textContent = "N/A";
    document.getElementById("bestMood").textContent = "😐";
    document.getElementById("insights").innerHTML =
      '<p class="text-gray-500 dark:text-gray-400">Unesite podatke nekoliko dana da biste videli analitiku.</p>';
  }

  updateStats(days) {
    const sleepDurations = days
      .filter((d) => d.sleep && d.sleep.duration)
      .map((d) => DataManager.parseSleepDuration(d.sleep.duration));

    if (sleepDurations.length > 0) {
      const avgSleep =
        sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length;
      const hours = Math.floor(avgSleep);
      const minutes = Math.round((avgSleep - hours) * 60);
      document.getElementById("avgSleep").textContent = `${hours}h ${minutes}m`;
    }

    const energyLevels = days.filter((d) => d.energy).map((d) => d.energy);
    if (energyLevels.length > 0) {
      const avgEnergy =
        energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length;
      document.getElementById("avgEnergy").textContent = `${avgEnergy.toFixed(
        1
      )}/10`;
    }

    const moods = days.filter((d) => d.mood).map((d) => d.mood);
    if (moods.length > 0) {
      const bestMood = Math.max(...moods);
      const moodEmojis = ["", "😢", "😕", "😐", "😊", "😄"];
      document.getElementById("bestMood").textContent =
        moodEmojis[bestMood] || "😊";
    }

    this.updateAdvancedStats(days);
  }

  updateAdvancedStats(days) {
    const energeticTime = this.findMostEnergeticTime(days);
    const energeticTimeEl = document.getElementById("energeticTime");
    if (energeticTimeEl) {
      energeticTimeEl.textContent = energeticTime;
    }

    const focusPattern = this.analyzeFocusPatterns(days);
    const focusPatternEl = document.getElementById("focusPattern");
    if (focusPatternEl) {
      focusPatternEl.textContent = focusPattern;
    }

    const sleepQuality = this.calculateSleepQuality(days);
    const sleepQualityEl = document.getElementById("sleepQuality");
    if (sleepQualityEl) {
      sleepQualityEl.textContent = sleepQuality;
    }
  }

  createCharts(days) {
    Object.values(this.charts).forEach((chart) => {
      if (chart) {
        chart.destroy();
      }
    });

    this.createEnergyChart(days);
    this.createMoodChart(days);
    this.createActivitiesChart(days);
    this.createTimeEnergyChart(days);
  }

  createEnergyChart(days) {
    const ctx = document.getElementById("energyChart");
    if (!ctx) return;

    const last7Days = days.slice(-7).map((d) => ({
      date: new Date(d.date).toLocaleDateString("sr-RS", { weekday: "short" }),
      energy: d.energy || 0,
    }));

    this.charts.energy = new Chart(ctx.getContext("2d"), {
      type: "line",
      data: {
        labels: last7Days.map((d) => d.date),
        datasets: [
          {
            label: "Nivo energije",
            data: last7Days.map((d) => d.energy),
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: this.getChartOptions(10),
    });
  }

  createMoodChart(days) {
    const ctx = document.getElementById("moodChart");
    if (!ctx) return;

    const last7Days = days.slice(-7).map((d) => ({
      date: new Date(d.date).toLocaleDateString("sr-RS", { weekday: "short" }),
      mood: d.mood || 0,
    }));

    this.charts.mood = new Chart(ctx.getContext("2d"), {
      type: "line",
      data: {
        labels: last7Days.map((d) => d.date),
        datasets: [
          {
            label: "Raspoloženje",
            data: last7Days.map((d) => d.mood),
            borderColor: "#F59E0B",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: this.getChartOptions(5),
    });
  }

  createActivitiesChart(days) {
    const ctx = document.getElementById("activitiesChart");
    if (!ctx) return;

    const activityCounts = {};
    days.forEach((day) => {
      if (day.activities) {
        day.activities.forEach((activity) => {
          activityCounts[activity] = (activityCounts[activity] || 0) + 1;
        });
      }
    });

    const sortedActivities = Object.entries(activityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    this.charts.activities = new Chart(ctx.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: sortedActivities.map(([activity]) =>
          this.getActivityLabel(activity)
        ),
        datasets: [
          {
            data: sortedActivities.map(([, count]) => count),
            backgroundColor: [
              "#3B82F6",
              "#10B981",
              "#F59E0B",
              "#EF4444",
              "#8B5CF6",
              "#06B6D4",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: document.documentElement.classList.contains("dark")
                ? "#fff"
                : "#374151",
            },
          },
        },
      },
    });
  }

  createTimeEnergyChart(days) {
    const ctx = document.getElementById("timeEnergyChart");
    if (!ctx) return;

    const hourlyEnergy = {};
    days.forEach((day) => {
      if (day.energy && day.timestamp) {
        const hour = new Date(day.timestamp).getHours();
        if (!hourlyEnergy[hour]) {
          hourlyEnergy[hour] = [];
        }
        hourlyEnergy[hour].push(day.energy);
      }
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const energyData = hours.map((hour) => {
      const energies = hourlyEnergy[hour] || [];
      return energies.length > 0
        ? energies.reduce((a, b) => a + b, 0) / energies.length
        : 0;
    });

    this.charts.timeEnergy = new Chart(ctx.getContext("2d"), {
      type: "bar",
      data: {
        labels: hours.map((h) => `${h}:00`),
        datasets: [
          {
            label: "Prosečna energija po satu",
            data: energyData,
            backgroundColor: "rgba(59, 130, 246, 0.6)",
            borderColor: "#3B82F6",
            borderWidth: 1,
          },
        ],
      },
      options: this.getChartOptions(10),
    });
  }

  getChartOptions(maxY) {
    return {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: document.documentElement.classList.contains("dark")
              ? "#fff"
              : "#374151",
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: maxY,
          ticks: {
            color: document.documentElement.classList.contains("dark")
              ? "#9CA3AF"
              : "#6B7280",
          },
          grid: {
            color: document.documentElement.classList.contains("dark")
              ? "#374151"
              : "#E5E7EB",
          },
        },
        x: {
          ticks: {
            color: document.documentElement.classList.contains("dark")
              ? "#9CA3AF"
              : "#6B7280",
          },
          grid: {
            color: document.documentElement.classList.contains("dark")
              ? "#374151"
              : "#E5E7EB",
          },
        },
      },
    };
  }

  findMostEnergeticTime(days) {
    const timeEnergyMap = {};
    days.forEach((day) => {
      if (day.energy && day.timestamp) {
        const hour = new Date(day.timestamp).getHours();
        if (!timeEnergyMap[hour]) {
          timeEnergyMap[hour] = [];
        }
        timeEnergyMap[hour].push(day.energy);
      }
    });

    let maxAvgEnergy = 0;
    let bestHour = "N/A";

    Object.entries(timeEnergyMap).forEach(([hour, energies]) => {
      const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
      if (avgEnergy > maxAvgEnergy) {
        maxAvgEnergy = avgEnergy;
        bestHour = `${hour}:00`;
      }
    });

    return bestHour;
  }

  analyzeFocusPatterns(days) {
    const lowEnergyDays = days.filter((d) => d.energy && d.energy <= 4);
    const totalDays = days.filter((d) => d.energy).length;

    if (totalDays === 0) return "N/A";

    const lowEnergyPercentage = (lowEnergyDays.length / totalDays) * 100;

    if (lowEnergyPercentage > 50) return "Česti padovi koncentracije";
    if (lowEnergyPercentage > 25) return "Umerni padovi koncentracije";
    return "Dobra koncentracija";
  }

  calculateSleepQuality(days) {
    const sleepData = days.filter((d) => d.sleep && d.sleep.duration);
    if (sleepData.length === 0) return "N/A";

    const optimalSleepDays = sleepData.filter((d) => {
      const duration = DataManager.parseSleepDuration(d.sleep.duration);
      return duration >= 7 && duration <= 9;
    });

    const percentage = (optimalSleepDays.length / sleepData.length) * 100;

    if (percentage >= 80) return "Odličan";
    if (percentage >= 60) return "Dobar";
    if (percentage >= 40) return "Prosečan";
    return "Loš";
  }

  getActivityLabel(activity) {
    const labels = {
      exercise: "Vežbanje",
      coffee: "Kafa",
      social: "Socijalizacija",
      work: "Rad",
      reading: "Čitanje",
      meditation: "Meditacija",
      walk: "Šetnja",
      screen: "Ekran vreme",
    };
    return labels[activity] || activity;
  }

  generateInsights(days) {
    const insights = [];
    const energyData = days
      .filter((d) => d.energy)
      .map((d) => parseFloat(d.energy));
    const sleepData = days.filter((d) => d.bedTime && d.wakeTime);
    const moodData = days.filter((d) => d.mood).map((d) => parseInt(d.mood));
    const activityData = days.filter(
      (d) => d.activities && d.activities.length > 0
    );

    if (energyData.length > 0) {
      const avgEnergy =
        energyData.reduce((a, b) => a + b, 0) / energyData.length;

      if (avgEnergy < 5) {
        insights.push({
          icon: "fa-battery-quarter",
          title: "Niska energija",
          text: "Vaš prosečni nivo energije je nizak. Razmislite o boljim navikama spavanja i ishrane.",
          color: "text-red-500",
        });
      } else if (avgEnergy >= 7) {
        insights.push({
          icon: "fa-battery-full",
          title: "Odlična energija",
          text: "Vaš nivo energije je odličan! Nastavite sa trenutnim navikama.",
          color: "text-green-500",
        });
      }
    }

    if (sleepData.length > 0) {
      const avgSleep =
        sleepData.reduce((sum, day) => {
          const hours = this.calculateSleepHours(day.bedTime, day.wakeTime);
          return sum + hours;
        }, 0) / sleepData.length;

      if (avgSleep < 7) {
        insights.push({
          icon: "fa-bed",
          title: "Nedovoljan san",
          text: `Prosečno spavate ${avgSleep.toFixed(
            1
          )}h. Preporučuje se 7-9 sati sna.`,
          color: "text-orange-500",
        });
      } else if (avgSleep > 9) {
        insights.push({
          icon: "fa-clock",
          title: "Previše sna",
          text: "Možda spavate više nego što je potrebno. Pokušajte sa kraćim spavanjem.",
          color: "text-blue-500",
        });
      }
    }

    if (moodData.length > 0) {
      const avgMood = moodData.reduce((a, b) => a + b, 0) / moodData.length;
      const lowMoodDays = moodData.filter((m) => m <= 2).length;

      if (lowMoodDays > days.length * 0.3) {
        insights.push({
          icon: "fa-heart",
          title: "Obratite pažnju na raspoloženje",
          text: "Često imate loše raspoloženje. Razmislite o razgovoru sa stručnjakom.",
          color: "text-red-500",
        });
      } else if (avgMood >= 4) {
        insights.push({
          icon: "fa-smile",
          title: "Pozitivno raspoloženje",
          text: "Vaše raspoloženje je uglavnom pozitivno. Odličan posao!",
          color: "text-green-500",
        });
      }
    }

    if (activityData.length > 0) {
      const exerciseDays = days.filter(
        (d) => d.activities && d.activities.includes("exercise")
      ).length;

      if (exerciseDays < 2) {
        insights.push({
          icon: "fa-dumbbell",
          title: "Više fizičke aktivnosti",
          text: "Dodajte više vežbanja u svoju rutinu za bolju energiju i raspoloženje.",
          color: "text-purple-500",
        });
      } else if (exerciseDays >= 4) {
        insights.push({
          icon: "fa-trophy",
          title: "Odlična fizička aktivnost",
          text: "Redovno vežbate! To pozitivno utiče na vašu energiju.",
          color: "text-yellow-500",
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        icon: "fa-thumbs-up",
        title: "Odličan rad!",
        text: "Vaši obrasci ponašanja izgledaju zdravo. Nastavite tako!",
        color: "text-green-500",
      });
    }

    const container =
      document.getElementById("weeklyInsights") ||
      document.getElementById("insights");
    if (container) {
      container.innerHTML = insights
        .map(
          (insight) => `
        <div class="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <i class="fas ${insight.icon} text-xl ${insight.color} mt-1"></i>
          <div>
            <h4 class="font-semibold text-gray-800 dark:text-white">${insight.title}</h4>
            <p class="text-gray-600 dark:text-gray-300">${insight.text}</p>
          </div>
        </div>
      `
        )
        .join("");
    }

    return insights;
  }

  calculateSleepHours(bedTime, wakeTime) {
    if (!bedTime || !wakeTime) return 0;

    const bed = new Date(`2000-01-01 ${bedTime}`);
    let wake = new Date(`2000-01-01 ${wakeTime}`);

    if (wake < bed) {
      wake.setDate(wake.getDate() + 1);
    }

    return (wake - bed) / (1000 * 60 * 60);
  }

  getEnergyTrends(data) {
    const trends = {
      improving: 0,
      declining: 0,
      stable: 0,
    };

    for (let i = 1; i < data.length; i++) {
      const current = parseFloat(data[i].energy || 0);
      const previous = parseFloat(data[i - 1].energy || 0);

      if (current > previous + 0.5) trends.improving++;
      else if (current < previous - 0.5) trends.declining++;
      else trends.stable++;
    }

    return trends;
  }

  findOptimalTimes(data) {
    const hourlyEnergy = {};

    data.forEach((day) => {
      if (day.energy && day.timestamp) {
        const hour = new Date(day.timestamp).getHours();
        if (!hourlyEnergy[hour]) hourlyEnergy[hour] = [];
        hourlyEnergy[hour].push(parseFloat(day.energy));
      }
    });

    const averageByHour = {};
    Object.keys(hourlyEnergy).forEach((hour) => {
      const energies = hourlyEnergy[hour];
      averageByHour[hour] =
        energies.reduce((a, b) => a + b, 0) / energies.length;
    });

    const bestHour = Object.keys(averageByHour).reduce((a, b) =>
      averageByHour[a] > averageByHour[b] ? a : b
    );

    return {
      bestHour: parseInt(bestHour),
      averageEnergy: averageByHour[bestHour]?.toFixed(1) || 0,
    };
  }

  generateWeeklyReport(data) {
    const report = {
      totalDays: data.length,
      averages: {
        sleep: this.calculateAverageSleep(data),
        energy: this.calculateAverageEnergy(data),
        mood: this.calculateAverageMood(data),
      },
      trends: this.getEnergyTrends(data),
      activities: this.getActivitySummary(data),
      insights: this.generateInsights(data),
      recommendations: this.generateRecommendations(data),
    };

    return report;
  }

  calculateAverageSleep(data) {
    const sleepData = data.filter((d) => d.bedTime && d.wakeTime);
    if (sleepData.length === 0) return 0;

    const totalHours = sleepData.reduce((sum, day) => {
      return sum + this.calculateSleepHours(day.bedTime, day.wakeTime);
    }, 0);

    return (totalHours / sleepData.length).toFixed(1);
  }

  calculateAverageEnergy(data) {
    const energyData = data
      .filter((d) => d.energy)
      .map((d) => parseFloat(d.energy));
    if (energyData.length === 0) return 0;

    return (energyData.reduce((a, b) => a + b, 0) / energyData.length).toFixed(
      1
    );
  }

  calculateAverageMood(data) {
    const moodData = data.filter((d) => d.mood).map((d) => parseInt(d.mood));
    if (moodData.length === 0) return 0;

    return (moodData.reduce((a, b) => a + b, 0) / moodData.length).toFixed(1);
  }

  getActivitySummary(data) {
    const activityCounts = {};

    data.forEach((day) => {
      if (day.activities) {
        day.activities.forEach((activity) => {
          activityCounts[activity] = (activityCounts[activity] || 0) + 1;
        });
      }
    });

    return Object.entries(activityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([activity, count]) => ({ activity, count }));
  }
}
