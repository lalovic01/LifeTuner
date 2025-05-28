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
          ${currentStep.content}
          <div class="flex justify-between items-center mt-8">
            <div class="flex space-x-2">
              ${steps
                .map(
                  (_, i) =>
                    `<div class="w-3 h-3 rounded-full ${
                      i === stepIndex ? "bg-primary" : "bg-gray-300"
                    } transition-colors"></div>`
                )
                .join("")}
            </div>
            <div class="flex space-x-3">
              ${
                stepIndex > 0
                  ? `<button id="onboardingPrev" class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">Nazad</button>`
                  : ""
              }
              <button id="onboardingNext" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">${
                currentStep.button
              }</button>
            </div>
          </div>
        </div>
      `;

      const nextBtn = document.getElementById("onboardingNext");
      const prevBtn = document.getElementById("onboardingPrev");

      nextBtn?.addEventListener("click", () => {
        if (stepIndex === 1) {
          this.saveOnboardingGoals();
        }

        if (stepIndex < steps.length - 1) {
          showStep(stepIndex + 1);
        } else {
          this.hideOnboarding();
        }
      });

      prevBtn?.addEventListener("click", () => {
        if (stepIndex > 0) {
          showStep(stepIndex - 1);
        }
      });
    };

    modal.classList.remove("hidden");
    showStep(0);
  }

  getWelcomeStepContent() {
    return `
      <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
        <i class="fas fa-chart-line text-3xl text-white"></i>
      </div>
      <h2 class="text-3xl font-bold text-gray-800 dark:text-white mb-4">Dobrodošli u LifeTuner!</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">Vaš personalni asistent za praćenje navika i poboljšanje životne energije.</p>
    `;
  }

  getGoalsStepContent() {
    return `
      <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center">
        <i class="fas fa-target text-3xl text-white"></i>
      </div>
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Postavite svoje ciljeve</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">Definirajte šta želite da postignete:</p>
      <div class="grid grid-cols-2 gap-4 text-left">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sati sna</label>
          <input type="number" id="onboardingSleepGoal" value="8" min="6" max="12" 
                 class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min. energija</label>
          <input type="number" id="onboardingEnergyGoal" value="7" min="1" max="10"
                 class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vežbanja nedeljno</label>
          <input type="number" id="onboardingExerciseGoal" value="3" min="1" max="7"
                 class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cilj raspoloženja</label>
          <input type="number" id="onboardingMoodGoal" value="4" min="1" max="5"
                 class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        </div>
      </div>
    `;
  }

  getTrackingStepContent() {
    return `
      <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
        <i class="fas fa-calendar-check text-3xl text-white"></i>
      </div>
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Dnevno praćenje</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">Svaki dan unosićete:</p>
      <div class="grid grid-cols-2 gap-4">
        <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <i class="fas fa-bed text-2xl text-blue-500 mb-2"></i>
          <div class="font-medium">San</div>
        </div>
        <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <i class="fas fa-smile text-2xl text-yellow-500 mb-2"></i>
          <div class="font-medium">Raspoloženje</div>
        </div>
        <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <i class="fas fa-bolt text-2xl text-green-500 mb-2"></i>
          <div class="font-medium">Energija</div>
        </div>
        <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <i class="fas fa-dumbbell text-2xl text-red-500 mb-2"></i>
          <div class="font-medium">Aktivnosti</div>
        </div>
      </div>
    `;
  }

  getAnalyticsStepContent() {
    return `
      <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
        <i class="fas fa-chart-bar text-3xl text-white"></i>
      </div>
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Analitika i uvidi</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">Pratite svoje obrasce:</p>
      <div class="space-y-3">
        <div class="flex items-center space-x-3">
          <i class="fas fa-clock text-primary"></i>
          <span>Najenergičnije vreme dana</span>
        </div>
        <div class="flex items-center space-x-3">
          <i class="fas fa-brain text-primary"></i>
          <span>Obrasci koncentracije</span>
        </div>
        <div class="flex items-center space-x-3">
          <i class="fas fa-trophy text-primary"></i>
          <span>Napredak ka ciljevima</span>
        </div>
        <div class="flex items-center space-x-3">
          <i class="fas fa-robot text-primary"></i>
          <span>Personalizovane preporuke</span>
        </div>
      </div>
    `;
  }

  getFinalStepContent() {
    return `
      <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
        <i class="fas fa-rocket text-3xl text-white"></i>
      </div>
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Spremni ste!</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">Počnite svoju putanju ka boljim navikama već danas!</p>
      <div class="bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-lg">
        <div class="text-lg font-semibold">Vaš prvi cilj:</div>
        <div class="text-sm opacity-90">Unesite podatke za današnji dan</div>
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
