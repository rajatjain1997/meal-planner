import type { MealType } from "../types";

/**
 * Get the current meal type based on local time
 * Breakfast: 5 AM - 10:59 AM
 * Lunch: 11 AM - 3:59 PM
 * Dinner: 4 PM - 11:59 PM
 * Breakfast (late night): 12 AM - 4:59 AM
 */
export const getCurrentMealType = (): MealType => {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 5 && hour < 11) {
    return "breakfast";
  } else if (hour >= 11 && hour < 16) {
    return "lunch";
  } else {
    return "dinner";
  }
};

/**
 * Get a human-readable time string for the current time
 */
export const getCurrentTimeString = (): string => {
  return new Date().toISOString();
};

/**
 * Format a timestamp to a readable time string
 */
export const formatMealTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Get a friendly message about what meal time it is
 */
export const getMealTimeMessage = (): string => {
  const mealType = getCurrentMealType();
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeStr = `${hour % 12 || 12}:${minute.toString().padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;

  const messages: Record<MealType, string> = {
    breakfast: `Good morning! It's ${timeStr} - perfect time for breakfast 🌅`,
    lunch: `Good afternoon! It's ${timeStr} - time for lunch ☀️`,
    dinner: `Good evening! It's ${timeStr} - dinner time 🌙`,
  };

  return messages[mealType];
};

