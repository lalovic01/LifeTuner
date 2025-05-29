export class DataManager {
  static getAllData() {
    const data = localStorage.getItem("lifeTunerData");
    return data ? JSON.parse(data) : {};
  }

  static saveDayData(date, dayData) {
    const allData = this.getAllData();
    allData[date] = {
      ...dayData,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
    localStorage.setItem("lifeTunerData", JSON.stringify(allData));
    this.triggerAutoBackup();
  }

  static exportData() {
    const allData = this.getAllData();
    const exportData = {
      appName: "LifeTuner",
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      totalEntries: Object.keys(allData).length,
      dateRange: this.getDateRange(allData),
      data: allData,
      goals: JSON.parse(localStorage.getItem("lifetuner_goals") || "{}"),
      settings: JSON.parse(localStorage.getItem("lifetuner_settings") || "{}"),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `lifetuner-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();

    return "Podaci su izvezeni u JSON formatu!";
  }

  static exportDataCSV() {
    const allData = this.getAllData();
    const headers = [
      "Datum",
      "Dan u nedelji",
      "Vreme spavanja",
      "Vreme buđenja",
      "Ukupno sati sna",
      "Raspoloženje (1-5)",
      "Nivo energije (1-10)",
      "Aktivnosti",
      "Broj aktivnosti",
      "Kvalitet sna",
      "Produktivnost",
      "Napomene",
    ];

    const rows = [headers];

    Object.entries(allData).forEach(([date, data]) => {
      const sleepHours = this.calculateSleepDuration(
        data.bedTime,
        data.wakeTime
      );
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.toLocaleDateString("sr-RS", {
        weekday: "long",
      });

      const activities = data.activities || [];
      const activitiesStr = activities
        .map((act) => this.translateActivity(act))
        .join("; ");

      const row = [
        date,
        dayOfWeek,
        data.bedTime || "",
        data.wakeTime || "",
        sleepHours || "",
        data.mood || "",
        data.energy || "",
        activitiesStr,
        activities.length,
        data.sleepQuality || "",
        data.productivity || "",
        data.notes || "",
      ];

      rows.push(row);
    });

    // Convert to CSV
    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `lifetuner-data-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();

    return "Podaci su izvezeni u CSV formatu!";
  }

  static calculateSleepDuration(bedTime, wakeTime) {
    if (!bedTime || !wakeTime) return "";

    const bed = new Date(`2000-01-01 ${bedTime}`);
    let wake = new Date(`2000-01-01 ${wakeTime}`);

    if (wake < bed) {
      wake.setDate(wake.getDate() + 1);
    }

    const diffMs = wake - bed;
    const hours = diffMs / (1000 * 60 * 60);
    return hours.toFixed(1);
  }

  static translateActivity(activity) {
    const translations = {
      exercise: "Vežbanje",
      coffee: "Kafa",
      social: "Druženje",
      work: "Rad",
      reading: "Čitanje",
      meditation: "Meditacija",
      walk: "Šetnja",
      screen: "Korišćenje ekrana",
      cooking: "Kuvanje",
      music: "Slušanje muzike",
      family: "Vreme sa porodicom",
      hobby: "Hobi aktivnosti",
    };
    return translations[activity] || activity;
  }

  static getDateRange(data) {
    const dates = Object.keys(data).sort();
    if (dates.length === 0) return null;

    return {
      from: dates[0],
      to: dates[dates.length - 1],
      totalDays: dates.length,
      span:
        Math.floor(
          (new Date(dates[dates.length - 1]) - new Date(dates[0])) /
            (1000 * 60 * 60 * 24)
        ) + 1,
    };
  }

  static triggerAutoBackup() {
    const lastBackup = localStorage.getItem("lifetuner_last_backup");
    const now = Date.now();
    const backupInterval = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (!lastBackup || now - parseInt(lastBackup) > backupInterval) {
      // Auto-backup logic could be implemented here
      localStorage.setItem("lifetuner_last_backup", now.toString());
    }
  }

  static importData(jsonData) {
    try {
      const imported = JSON.parse(jsonData);

      if (imported.data) {
        const existingData = this.getAllData();
        const mergedData = { ...existingData, ...imported.data };
        localStorage.setItem("lifeTunerData", JSON.stringify(mergedData));
      }

      if (imported.goals) {
        localStorage.setItem("lifetuner_goals", JSON.stringify(imported.goals));
      }

      return { success: true, message: "Podaci su uspešno uvezeni!" };
    } catch (error) {
      return {
        success: false,
        message: "Greška pri uvozu podataka: " + error.message,
      };
    }
  }

  static clearAllData() {
    const keys = [
      "lifeTunerData",
      "lifetuner_goals",
      "lifetuner_settings",
      "lifetuner_reminders",
      "lifetuner_theme",
      "lifetuner_visited",
      "lifetuner_last_backup",
    ];

    keys.forEach((key) => localStorage.removeItem(key));

    return "Svi podaci su obrisani!";
  }

  static getStorageInfo() {
    const data = this.getAllData();
    const dataSize = JSON.stringify(data).length;
    const totalEntries = Object.keys(data).length;

    return {
      totalEntries,
      dataSize: (dataSize / 1024).toFixed(2) + " KB",
      dateRange: this.getDateRange(data),
      lastModified: localStorage.getItem("lifetuner_last_backup")
        ? new Date(
            parseInt(localStorage.getItem("lifetuner_last_backup"))
          ).toLocaleDateString()
        : "Nepoznato",
    };
  }
}
