import type { DailyLog } from "../types";
import { getCurrentTimeString } from "./time";

const STORAGE_KEY = "mealCreditsLogs";

export const loadDailyLogs = (): DailyLog[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as DailyLog[];
  } catch {
    console.error("Failed to load daily logs from localStorage");
    return [];
  }
};

export const saveDailyLog = (log: DailyLog): void => {
  const logs = loadDailyLogs();
  const existingIndex = logs.findIndex((l) => l.date === log.date);

  if (existingIndex >= 0) {
    logs[existingIndex] = log;
  } else {
    logs.push(log);
  }

  // Sort by date descending
  logs.sort((a, b) => b.date.localeCompare(a.date));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("mealCreditsUpdated"));
  } catch {
    console.error("Failed to save daily log to localStorage");
  }
};

export const getDailyLog = (date: string): DailyLog | undefined => {
  const logs = loadDailyLogs();
  return logs.find((log) => log.date === date);
};

export const getAllDailyLogs = (): DailyLog[] => {
  return loadDailyLogs().sort((a, b) => b.date.localeCompare(a.date));
};

export const deleteDailyLog = (date: string): void => {
  const logs = loadDailyLogs().filter((log) => log.date !== date);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    console.error("Failed to delete daily log from localStorage");
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getTodayDateString = (): string => {
  return new Date().toISOString().split("T")[0];
};

export const logMealForToday = (
  mealId: string,
  mealType: "breakfast" | "lunch" | "dinner"
): void => {
  const today = getTodayDateString();
  const existingLog = getDailyLog(today) || {
    date: today,
  };

  const updatedLog: DailyLog = {
    ...existingLog,
    [`${mealType}Id`]: mealId,
    [`${mealType}Time`]: getCurrentTimeString(),
  };

  saveDailyLog(updatedLog);
};

