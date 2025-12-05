import type { DailyLog, LoggedMeal, ChatMessage } from "../types";
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
  const log = logs.find((log) => log.date === date);
  // Migrate legacy format on read
  return log ? migrateLegacyLog(log) : undefined;
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

/**
 * Migrate legacy log format to new format
 */
const migrateLegacyLog = (log: DailyLog): DailyLog => {
  const migrated: DailyLog = { ...log };
  
  // Migrate breakfast
  if (log.breakfastId && !log.breakfast) {
    migrated.breakfast = [{
      mealId: log.breakfastId,
      timestamp: log.breakfastTime || getCurrentTimeString(),
    }];
  }
  
  // Migrate lunch
  if (log.lunchId && !log.lunch) {
    migrated.lunch = [{
      mealId: log.lunchId,
      timestamp: log.lunchTime || getCurrentTimeString(),
    }];
  }
  
  // Migrate dinner
  if (log.dinnerId && !log.dinner) {
    migrated.dinner = [{
      mealId: log.dinnerId,
      timestamp: log.dinnerTime || getCurrentTimeString(),
    }];
  }
  
  return migrated;
};

/**
 * Log a meal for today at the specified time slot
 * Appends to the array instead of replacing
 */
export const logMealForToday = (
  mealId: string,
  mealType: "breakfast" | "lunch" | "dinner"
): void => {
  const today = getTodayDateString();
  const existingLog = getDailyLog(today);
  
  // Migrate legacy format if needed
  const log = existingLog ? migrateLegacyLog(existingLog) : { date: today };
  
  const newMeal: LoggedMeal = {
    mealId,
    timestamp: getCurrentTimeString(),
  };
  
  const updatedLog: DailyLog = {
    ...log,
    [mealType]: [...(log[mealType] || []), newMeal],
  };

  saveDailyLog(updatedLog);
};

// Chat message storage
const CHAT_STORAGE_KEY = "chatMessages";

export interface StoredChatMessages {
  date: string;
  messages: ChatMessage[];
}

/**
 * Load today's chat messages
 */
export const loadTodayChatMessages = (): ChatMessage[] => {
  try {
    const today = getTodayDateString();
    const data = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!data) return [];
    
    const stored: StoredChatMessages[] = JSON.parse(data);
    const todayChat = stored.find((chat) => chat.date === today);
    return todayChat?.messages || [];
  } catch {
    console.error("Failed to load chat messages from localStorage");
    return [];
  }
};

/**
 * Save today's chat messages
 */
export const saveTodayChatMessages = (messages: ChatMessage[]): void => {
  try {
    const today = getTodayDateString();
    const data = localStorage.getItem(CHAT_STORAGE_KEY);
    const stored: StoredChatMessages[] = data ? JSON.parse(data) : [];
    
    const existingIndex = stored.findIndex((chat) => chat.date === today);
    const todayChat: StoredChatMessages = {
      date: today,
      messages,
    };
    
    if (existingIndex >= 0) {
      stored[existingIndex] = todayChat;
    } else {
      stored.push(todayChat);
    }
    
    // Keep only last 30 days of chat history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const filtered = stored.filter((chat) => {
      const chatDate = new Date(chat.date);
      return chatDate >= thirtyDaysAgo;
    });
    
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    console.error("Failed to save chat messages to localStorage");
  }
};

