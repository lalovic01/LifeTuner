import { DataManager } from "./data-manager.js";
import { UIComponents } from "./ui-components.js";

export class AIAssistant {
  constructor() {
    this.recommendations = {
      tired: [
        {
          icon: "fa-bed",
          title: "Kratka pauza",
          description: "Odmorite se 15-20 minuta",
        },
        {
          icon: "fa-coffee",
          title: "Popijte kafu",
          description: "Kofeinski boost za energiju",
        },
        {
          icon: "fa-walking",
          title: "Kratka šetnja",
          description: "Svež vazduh će vam pomoći",
        },
      ],
      stressed: [
        {
          icon: "fa-leaf",
          title: "Duboko disanje",
          description: "5 minuta meditacije",
        },
        {
          icon: "fa-music",
          title: "Opuštajuća muzika",
          description: "Poslušajte omiljene pesme",
        },
        {
          icon: "fa-bath",
          title: "Topla kupka",
          description: "Opustite se u toploj vodi",
        },
      ],
      energetic: [
        {
          icon: "fa-dumbbell",
          title: "Vežbanje",
          description: "Iskoristite energiju za aktivnost",
        },
        {
          icon: "fa-tasks",
          title: "Završite zadatke",
          description: "Vreme je za produktivnost",
        },
        {
          icon: "fa-users",
          title: "Socijalizacija",
          description: "Pozovite prijatelje",
        },
      ],
      unfocused: [
        {
          icon: "fa-mobile-alt",
          title: "Uklonite distrakcije",
          description: "Stavite telefon u drugi mod",
        },
        {
          icon: "fa-list",
          title: "Napravite listu",
          description: "Organizujte svoje zadatke",
        },
        {
          icon: "fa-clock",
          title: "Pomodoro tehnika",
          description: "25 min rada, 5 min pauze",
        },
      ],
    };

    this.motivationalQuotes = [
      "Svaki novi dan je prilika da postanete bolja verzija sebe.",
      "Uspeh je zbir malih napora koji se ponavljaju iz dana u dan.",
      "Vaša jedina granica je vi sami.",
      "Počnite tamo gde jeste, koristite ono što imate, radite ono što možete.",
      "Promene počinju na kraju vaše zone komfora.",
      "Mala pobeda svakog dana vodi ka velikom uspehu.",
      "Kvalitet sna je temelj dobrog dana.",
      "Pokret je lek za telo i dušu.",
      "Sve što počnete danas, može promeniti vaš život",
      "Energija koju uložite u sebe, vraća vam se udvostručeno.",
      "Consistent small steps lead to remarkable transformations.",
      "Your future self will thank you for the habits you build today.",
      "Progress, not perfection, is the goal.",
      "Every expert was once a beginner who refused to give up.",
    ];
  }

  showRecommendations(currentFeeling) {
    if (!currentFeeling) {
      UIComponents.showToast("Prvo izaberite kako se osećate", "warning");
      return;
    }

    const allData = DataManager.getAllData();
    const recentDays = DataManager.getLast7Days(allData);
    const recommendations = this.generateSmartRecommendations(
      currentFeeling,
      recentDays
    );

    const container = document.getElementById("recommendations");
    const recContainer = document.getElementById("recommendationsContainer");

    container.innerHTML = "";

    recommendations.forEach((rec) => {
      const card = document.createElement("div");
      card.className =
        "bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-l-4 border-primary";
      card.innerHTML = `
        <div class="text-center">
          <i class="fas ${rec.icon} text-3xl text-primary mb-4"></i>
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">${
            rec.title
          }</h4>
          <p class="text-gray-600 dark:text-gray-300 mb-3">${
            rec.description
          }</p>
          <div class="text-sm text-primary font-medium">${
            rec.reason || ""
          }</div>
        </div>
      `;

      card.addEventListener("click", () => {
        UIComponents.showToast(`Odlična ideja! ${rec.title}`, "success");
        this.trackRecommendationUsage(rec.id);
      });

      container.appendChild(card);
    });

    recContainer.classList.remove("hidden");
  }

  generateSmartRecommendations(feeling, recentDays) {
    const baseRecommendations = this.recommendations[feeling] || [];
    const smartRecommendations = [...baseRecommendations];

    // Analyze recent patterns
    const avgEnergy =
      recentDays.length > 0
        ? recentDays
            .filter((d) => d.energy)
            .reduce((sum, d) => sum + d.energy, 0) /
          recentDays.filter((d) => d.energy).length
        : 5;

    const avgSleep =
      recentDays.length > 0
        ? recentDays
            .filter((d) => d.sleep?.duration)
            .reduce(
              (sum, d) =>
                sum + DataManager.parseSleepDuration(d.sleep.duration),
              0
            ) / recentDays.filter((d) => d.sleep?.duration).length
        : 7;

    const exerciseFrequency = recentDays.filter((d) =>
      d.activities?.includes("exercise")
    ).length;

    if (avgEnergy < 6) {
      smartRecommendations.push({
        id: "energy_boost",
        icon: "fa-bolt",
        title: "Povećajte energiju",
        description: "Vaša energija je bila niska u poslednje vreme",
        reason: `Prosečna energija: ${avgEnergy.toFixed(1)}/10`,
      });
    }

    if (avgSleep < 7) {
      smartRecommendations.push({
        id: "better_sleep",
        icon: "fa-bed",
        title: "Poboljšajte san",
        description: "Spavate manje od preporučenih 7-9 sati",
        reason: `Prosečan san: ${avgSleep.toFixed(1)}h`,
      });
    }

    if (exerciseFrequency < 2) {
      smartRecommendations.push({
        id: "more_exercise",
        icon: "fa-dumbbell",
        title: "Više pokreta",
        description: "Dodajte fizičku aktivnost u rutinu",
        reason: `${exerciseFrequency} vežbanja ove nedelje`,
      });
    }

    return smartRecommendations.slice(0, 3);
  }

  trackRecommendationUsage(recommendationId) {
    const usage = JSON.parse(
      localStorage.getItem("recommendation_usage") || "{}"
    );
    usage[recommendationId] = (usage[recommendationId] || 0) + 1;
    localStorage.setItem("recommendation_usage", JSON.stringify(usage));
  }

  updateDailyMotivation() {
    const quote =
      this.motivationalQuotes[
        Math.floor(Math.random() * this.motivationalQuotes.length)
      ];
    const motivationEl = document.getElementById("dailyMotivation");
    if (motivationEl) {
      motivationEl.textContent = quote;
    }
  }

  checkMissedDays() {
    const allData = DataManager.getAllData();
    const today = new Date();
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

    const recentDays = [];
    for (let d = new Date(twoDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      recentDays.push(d.toISOString().split("T")[0]);
    }

    const missedDays = recentDays.filter((date) => !allData[date]);

    if (missedDays.length >= 2) {
      setTimeout(() => {
        UIComponents.showToast(
          "Niste uneli podatke već 2+ dana. Ne zaboravite da pratite svoje navike!",
          "warning",
          5000
        );
      }, 2000);
    }
  }
}
