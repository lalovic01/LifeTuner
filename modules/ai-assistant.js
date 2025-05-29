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
          action: "Postavite alarm i odmorite se",
        },
        {
          icon: "fa-coffee",
          title: "Kofeinski boost",
          description: "Popijte kafu ili zeleni čaj",
          action: "Umereno konzumirajte kofein",
        },
        {
          icon: "fa-walking",
          title: "Kratka šetnja",
          description: "Svež vazduh će vam pomoći",
          action: "Prošetajte 10-15 minuta napolju",
        },
        {
          icon: "fa-tint",
          title: "Hidratacija",
          description: "Dehidracija može uzrokovati umor",
          action: "Popijte čašu vode",
        },
      ],
      stressed: [
        {
          icon: "fa-leaf",
          title: "Duboko disanje",
          description: "4-7-8 tehnika disanja",
          action: "Udahnite 4s, zadržite 7s, izdahnite 8s",
        },
        {
          icon: "fa-music",
          title: "Opuštajuća muzika",
          description: "Poslušajte omiljene pesme",
          action: "Pustite umirujuće melodije",
        },
        {
          icon: "fa-list-alt",
          title: "Organizujte zadatke",
          description: "Napravite prioritete",
          action: "Podelite velike zadatke na manje delove",
        },
        {
          icon: "fa-phone",
          title: "Pozovite prijatelja",
          description: "Podelite kako se osećate",
          action: "Razgovor može pomoći",
        },
      ],
      energetic: [
        {
          icon: "fa-dumbbell",
          title: "Vežbanje",
          description: "Iskoristite energiju za aktivnost",
          action: "20-30 minuta fizičke aktivnosti",
        },
        {
          icon: "fa-tasks",
          title: "Završite zadatke",
          description: "Vreme je za produktivnost",
          action: "Fokusirajte se na važne projekte",
        },
        {
          icon: "fa-users",
          title: "Socijalizacija",
          description: "Pozovite prijatelje",
          action: "Organizujte druženje ili poziv",
        },
        {
          icon: "fa-lightbulb",
          title: "Kreativni projekat",
          description: "Započnite nešto novo",
          action: "Koristite energiju za kreativnost",
        },
      ],
      unfocused: [
        {
          icon: "fa-mobile-alt",
          title: "Uklonite distrakcije",
          description: "Stavite telefon u drugi mod",
          action: "Isključite notifikacije",
        },
        {
          icon: "fa-list",
          title: "Napravite listu",
          description: "Organizujte svoje zadatke",
          action: "Zapišite prioritete za danas",
        },
        {
          icon: "fa-clock",
          title: "Pomodoro tehnika",
          description: "25 min rada, 5 min pauze",
          action: "Postavite timer i fokusirajte se",
        },
        {
          icon: "fa-home",
          title: "Promenite okruženje",
          description: "Nova lokacija može pomoći",
          action: "Radite iz drugog mesta",
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
      "Mali koraci svaki dan vode ka velikim promenama.",
      "Vaše buduće ja će vam biti zahvalno za navike koje gradite danas.",
      "Napredak, ne savršenstvo, je cilj.",
      "Svaki ekspert je nekada bio početnik koji nije odustao.",
      "Konzistentnost je majka svih uspeha.",
      "Zdrave navike su investicija u vašu budućnost.",
    ];

    this.contextualAdvice = {
      morning: [
        "Počnite dan sa čašom vode",
        "5 minuta meditacije može promeniti ceo dan",
        "Postavite 3 glavna cilja za danas",
      ],
      afternoon: [
        "Vreme je za energetski boost - prošetajte malo",
        "Proverite kako ste napredovali sa jutarnjim ciljevima",
        "Kratka pauza će povećati produktivnost",
      ],
      evening: [
        "Spremite se za kvalitetan san",
        "Razmislite o pozitivnim stvarima dana",
        "Isključite ekrane sat vremena pre spavanja",
      ],
    };
  }

  generatePersonalizedRecommendations(currentFeeling, userData = null) {
    const baseRecommendations = this.recommendations[currentFeeling] || [];

    // Add contextual recommendations based on time of day
    const timeOfDay = this.getTimeOfDay();
    const contextualRecs = this.getContextualRecommendations(timeOfDay);

    // Personalize based on user data if available
    let personalizedRecs = [...baseRecommendations];

    if (userData) {
      personalizedRecs = this.personalizeRecommendations(
        personalizedRecs,
        userData
      );
    }

    return {
      primary: personalizedRecs.slice(0, 3),
      contextual: contextualRecs,
      timeOfDay: timeOfDay,
    };
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  }

  getContextualRecommendations(timeOfDay) {
    return this.contextualAdvice[timeOfDay] || [];
  }

  personalizeRecommendations(recommendations, userData) {
    // Add logic to personalize recommendations based on user's historical data
    const recentData = this.getRecentUserData(userData);

    if (recentData.lowExercise) {
      recommendations.unshift({
        icon: "fa-running",
        title: "Dodajte fizičku aktivnost",
        description: "Niste vežbali u poslednje vreme",
        action: "Kratko vežbanje ili šetnja",
      });
    }

    if (recentData.irregularSleep) {
      recommendations.unshift({
        icon: "fa-moon",
        title: "Regulišite san",
        description: "Vaš raspored spavanja je bio nepravilan",
        action: "Idite na spavanje u isto vreme",
      });
    }

    return recommendations;
  }

  getRecentUserData(userData) {
    const recent = Object.values(userData).slice(-7); // Last 7 days

    const exerciseCount = recent.filter(
      (day) => day.activities && day.activities.includes("exercise")
    ).length;

    const sleepTimes = recent
      .filter((day) => day.bedTime)
      .map((day) => new Date(`2000-01-01 ${day.bedTime}`).getHours());

    const sleepVariance =
      sleepTimes.length > 1
        ? Math.max(...sleepTimes) - Math.min(...sleepTimes)
        : 0;

    return {
      lowExercise: exerciseCount < 2,
      irregularSleep: sleepVariance > 2,
      averageEnergy:
        recent.reduce((sum, day) => sum + (day.energy || 0), 0) / recent.length,
    };
  }

  getRandomMotivation() {
    const randomIndex = Math.floor(
      Math.random() * this.motivationalQuotes.length
    );
    return this.motivationalQuotes[randomIndex];
  }

  getTodaysMotivation() {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today - new Date(today.getFullYear(), 0, 0)) / 86400000
    );
    return this.motivationalQuotes[dayOfYear % this.motivationalQuotes.length];
  }

  generateDailyInsight(userData) {
    if (!userData || Object.keys(userData).length === 0) {
      return "Počnite sa unosom podataka da biste dobili personalizovane uvide!";
    }

    const recentData = Object.values(userData).slice(-7);
    const avgEnergy =
      recentData.reduce((sum, day) => sum + (day.energy || 0), 0) /
      recentData.length;
    const exerciseDays = recentData.filter(
      (day) => day.activities && day.activities.includes("exercise")
    ).length;

    if (avgEnergy > 7 && exerciseDays >= 3) {
      return "Odlično! Vaša energija je visoka i redovno vežbate. Nastavite tako! 💪";
    } else if (avgEnergy < 5) {
      return "Primetili smo da vam je energija niska. Pokušajte sa više spavanja i fizičke aktivnosti. 🌙";
    } else if (exerciseDays < 2) {
      return "Dodavanje malo više fizičke aktivnosti može značajno poboljšati vašu energiju i raspoloženje. 🏃‍♂️";
    }

    return "Kontinuirano praćenje navika vam pomaže da bolje razumete sebe. Nastavite sa unosom! 📊";
  }
}
