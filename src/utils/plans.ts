import type { MealPlan, MealPlanOption } from "../types";
import { getMealsByTypeIncludingChat } from "./chatMeals";

const STORAGE_KEY = "mealPlans";

/**
 * Generate 3 random meal plan options
 */
export const generateMealPlanOptions = (): MealPlanOption[] => {
  const breakfastMeals = getMealsByTypeIncludingChat("breakfast");
  const lunchMeals = getMealsByTypeIncludingChat("lunch");
  const dinnerMeals = getMealsByTypeIncludingChat("dinner");

  const options: MealPlanOption[] = [];

  // Generate 3 unique combinations
  const usedCombinations = new Set<string>();

  while (options.length < 3) {
    const breakfast = breakfastMeals[Math.floor(Math.random() * breakfastMeals.length)];
    const lunch = lunchMeals[Math.floor(Math.random() * lunchMeals.length)];
    const dinner = dinnerMeals[Math.floor(Math.random() * dinnerMeals.length)];

    const comboKey = `${breakfast.id}-${lunch.id}-${dinner.id}`;
    
    if (!usedCombinations.has(comboKey)) {
      usedCombinations.add(comboKey);
      options.push({
        breakfastId: breakfast.id,
        lunchId: lunch.id,
        dinnerId: dinner.id,
      });
    }
  }

  return options;
};

/**
 * Load all meal plans from localStorage
 */
export const loadMealPlans = (): MealPlan[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as MealPlan[];
  } catch {
    console.error("Failed to load meal plans from localStorage");
    return [];
  }
};

/**
 * Save a meal plan
 */
export const saveMealPlan = (plan: MealPlan): void => {
  const plans = loadMealPlans();
  const existingIndex = plans.findIndex((p) => p.date === plan.date);

  if (existingIndex >= 0) {
    plans[existingIndex] = plan;
  } else {
    plans.push(plan);
  }

  // Sort by date descending
  plans.sort((a, b) => b.date.localeCompare(a.date));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("mealPlansUpdated"));
  } catch {
    console.error("Failed to save meal plan to localStorage");
  }
};

/**
 * Get meal plan for a specific date
 */
export const getMealPlan = (date: string): MealPlan | undefined => {
  const plans = loadMealPlans();
  return plans.find((plan) => plan.date === date);
};

/**
 * Delete a meal plan
 */
export const deleteMealPlan = (date: string): void => {
  const plans = loadMealPlans().filter((plan) => plan.date !== date);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    window.dispatchEvent(new Event("mealPlansUpdated"));
  } catch {
    console.error("Failed to delete meal plan from localStorage");
  }
};

/**
 * Get next day's date string
 */
export const getNextDayDateString = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

