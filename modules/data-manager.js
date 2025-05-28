export class DataManager {
  static getAllData() {
    const data = localStorage.getItem("lifeTunerData");
    return data ? JSON.parse(data) : {};
  }

  static saveDayData(date, dayData) {
    const allData = this.getAllData();
    allData[date] = dayData;
    localStorage.setItem("lifeTunerData", JSON.stringify(allData));
  }

  static exportData() {
    const allData = this.getAllData();
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = "lifetuner-data.json";
    link.click();

    return "Podaci su izvezeni!";
  }

  static exportDataCSV() {
    const allData = this.getAllData();
    const days = Object.values(allData);

    if (days.length === 0) {
      throw new Error("Nema podataka za izvoz");
    }

    let csv =
      "Datum,Vreme spavanja,Vreme buđenja,Trajanje sna,Raspoloženje,Energija,Aktivnosti\n";

    days.forEach((day) => {
      const activities = day.activities ? day.activities.join(";") : "";
      const mood = day.mood || "";
      const energy = day.energy || "";
      const bedTime = day.sleep?.bedTime || "";
      const wakeTime = day.sleep?.wakeTime || "";
      const duration = day.sleep?.duration || "";

      csv += `${day.date},${bedTime},${wakeTime},${duration},${mood},${energy},"${activities}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "lifetuner-data.csv";
    link.click();

    return "CSV podaci su izvezeni!";
  }

  static clearAllData() {
    localStorage.removeItem("lifeTunerData");
    localStorage.removeItem("lifetuner_goals");
    localStorage.removeItem("lifetuner_streak");
    localStorage.removeItem("recommendation_usage");
    return "Svi podaci su obrisani";
  }

  static getLast7Days(allData) {
    const today = new Date();
    const last7Days = [];

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      if (allData[dateStr]) {
        last7Days.push(allData[dateStr]);
      }
    }

    return last7Days;
  }

  static parseSleepDuration(duration) {
    const match = duration.match(/(\d+)h (\d+)m/);
    if (match) {
      return parseInt(match[1]) + parseInt(match[2]) / 60;
    }
    return 0;
  }
}
