import { UIComponents } from "./ui-components.js";

export class Onboarding {
  showOnboardingIfNeeded() {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      this.showOnboardingFlow();
    }
  }

  showOnboardingFlow() {
    const modal = document.getElementById("onboardingModal");
    const content = modal.querySelector(".bg-white, .bg-gray-800");

    let step = 0;
    const steps = [
      {
        title: "Dobrodošli u LifeTuner!",
        button: "Sledeće",
        content: this.getWelcomeStepContent(),
      },
      {
        title: "Postavite svoje ciljeve",
        button: "Sledeće",
        content: this.getGoalsStepContent(),
      },
      {
        title: "Dnevno praćenje",
        button: "Sledeće",
        content: this.getTrackingStepContent(),
      },
      {
        title: "Analitika i uvidi",
        button: "Sledeće",
        content: this.getAnalyticsStepContent(),
      },
      {
        title: "Spremni ste!",
        button: "Počnimo!",
        content: this.getFinalStepContent(),
      },
    ];

    const showStep = (stepIndex) => {
      const currentStep = steps[stepIndex];
      content.innerHTML = `
        <div class="text-center">
          <div class="w-20 h-20 bg-gradient-to-br from-primary to-purple rounded-full flex items-center justify-center mx-auto mb-6">
            <i class="fas fa-heart text-3xl text-white"></i>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">${
            currentStep.title
          }</h2>
          <div class="mb-8">${currentStep.content}</div>
          <div class="flex justify-between items-center">
            <div class="flex space-x-2">
              ${steps
                .map(
                  (_, i) => `
                <div class="w-3 h-3 rounded-full ${
                  i === stepIndex ? "bg-primary" : "bg-gray-300"
                }"></div>
              `
                )
                .join("")}
            </div>
            <div class="space-x-3">
              ${
                stepIndex > 0
                  ? `<button id="prevStep" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors">Nazad</button>`
                  : ""
              }
              <button id="nextStep" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">${
                currentStep.button
              }</button>
            </div>
          </div>
        </div>
      `;

      if (stepIndex > 0) {
        content.querySelector("#prevStep").onclick = () =>
          showStep(stepIndex - 1);
      }

      content.querySelector("#nextStep").onclick = () => {
        if (stepIndex < steps.length - 1) {
          showStep(stepIndex + 1);
        } else {
          modal.classList.add("hidden");
          localStorage.setItem("lifetuner_visited", "true");
        }
      };
    };

    modal.classList.remove("hidden");
    showStep(0);
  }

  getWelcomeStepContent() {
    return `
      <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
        LifeTuner je vaš lični asistent za praćenje navika i poboljšanje kvaliteta života. 
        Svaki dan unosite podatke o snu, raspoloženju, energiji i aktivnostima.
      </p>
    `;
  }

  getGoalsStepContent() {
    return `
      <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
        Postavite svoje lične ciljeve za san, energiju i aktivnosti. 
        Ovo će vam pomoći da pratite napredak i ostanete motivisani.
      </p>
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <i class="fas fa-lightbulb text-blue-500 mr-2"></i>
        <span class="text-sm">Ciljevi se mogu menjati u podešavanjima</span>
      </div>
    `;
  }

  getTrackingStepContent() {
    return `
      <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
        Svaki dan unesite podatke o:
      </p>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="flex items-center space-x-2">
          <i class="fas fa-bed text-blue-500"></i>
          <span>Kvalitet sna</span>
        </div>
        <div class="flex items-center space-x-2">
          <i class="fas fa-smile text-yellow-500"></i>
          <span>Raspoloženje</span>
        </div>
        <div class="flex items-center space-x-2">
          <i class="fas fa-bolt text-green-500"></i>
          <span>Nivo energije</span>
        </div>
        <div class="flex items-center space-x-2">
          <i class="fas fa-dumbbell text-red-500"></i>
          <span>Aktivnosti</span>
        </div>
      </div>
    `;
  }

  getAnalyticsStepContent() {
    return `
      <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
        Analizirajte svoje obrasce i otkrijte šta utiče na vaše blagostanje:
      </p>
      <div class="space-y-2 text-sm text-left">
        <div class="flex items-center space-x-2">
          <i class="fas fa-chart-line text-purple-500"></i>
          <span>Trendovi energije i raspoloženja</span>
        </div>
        <div class="flex items-center space-x-2">
          <i class="fas fa-clock text-blue-500"></i>
          <span>Najenergičnije vreme dana</span>
        </div>
        <div class="flex items-center space-x-2">
          <i class="fas fa-brain text-green-500"></i>
          <span>Pametni uvidi i preporuke</span>
        </div>
      </div>
    `;
  }

  getFinalStepContent() {
    return `
      <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
        Sve je spremno! Počnite sa unosom podataka već danas i gradite zdrave navike korak po korak.
      </p>
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <i class="fas fa-check-circle text-green-500 mr-2"></i>
        <span class="text-sm font-medium">Tip: Konzistentnost je ključ uspeha!</span>
      </div>
    `;
  }

  saveOnboardingGoals() {
    const sleepGoal =
      document.getElementById("onboardingSleepGoal")?.value || 8;
    const energyGoal =
      document.getElementById("onboardingEnergyGoal")?.value || 7;
    const exerciseGoal =
      document.getElementById("onboardingExerciseGoal")?.value || 3;
    const moodGoal = document.getElementById("onboardingMoodGoal")?.value || 4;

    const goals = {
      sleepHours: parseInt(sleepGoal),
      minEnergy: parseInt(energyGoal),
      exerciseFrequency: parseInt(exerciseGoal),
      moodTarget: parseInt(moodGoal),
    };

    localStorage.setItem("lifetuner_goals", JSON.stringify(goals));
    return goals;
  }

  hideOnboarding() {
    UIComponents.hideModal("onboardingModal");
    localStorage.setItem("hasSeenOnboarding", "true");
  }
}
