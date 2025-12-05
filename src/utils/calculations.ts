import type { DailyLog, Meal } from "../types";
import { getMealByIdFromLibrary } from "./chatMeals";

export interface DailySummary {
  totalCredits: number;
  mealCredits: number;
  extraCredits: number;
  cheatCreditsUsed: number;
  netCredits: number;
  totalCalories: number;
  breakfastMeals: Meal[];
  lunchMeals: Meal[];
  dinnerMeals: Meal[];
  // Legacy fields for backward compatibility
  breakfastMeal?: Meal;
  lunchMeal?: Meal;
  dinnerMeal?: Meal;
}

export const calculateDailySummary = (log: DailyLog): DailySummary => {
  // Get all meals for each time slot
  const breakfastMeals = (log.breakfast || []).map(entry => 
    getMealByIdFromLibrary(entry.mealId)
  ).filter((meal): meal is Meal => meal !== undefined);
  
  const lunchMeals = (log.lunch || []).map(entry => 
    getMealByIdFromLibrary(entry.mealId)
  ).filter((meal): meal is Meal => meal !== undefined);
  
  const dinnerMeals = (log.dinner || []).map(entry => 
    getMealByIdFromLibrary(entry.mealId)
  ).filter((meal): meal is Meal => meal !== undefined);
  
  // Legacy support: also check old format
  if (log.breakfastId && breakfastMeals.length === 0) {
    const meal = getMealByIdFromLibrary(log.breakfastId);
    if (meal) breakfastMeals.push(meal);
  }
  if (log.lunchId && lunchMeals.length === 0) {
    const meal = getMealByIdFromLibrary(log.lunchId);
    if (meal) lunchMeals.push(meal);
  }
  if (log.dinnerId && dinnerMeals.length === 0) {
    const meal = getMealByIdFromLibrary(log.dinnerId);
    if (meal) dinnerMeals.push(meal);
  }

  // Calculate totals from all meals
  const mealCredits =
    breakfastMeals.reduce((sum, meal) => sum + (meal.credits || 0), 0) +
    lunchMeals.reduce((sum, meal) => sum + (meal.credits || 0), 0) +
    dinnerMeals.reduce((sum, meal) => sum + (meal.credits || 0), 0);

  const extraCredits = log.extraCredits || 0;
  const cheatCreditsUsed = log.cheatCreditsUsed || 0;

  const totalCredits = mealCredits + extraCredits;
  const netCredits = totalCredits - cheatCreditsUsed;

  const totalCalories =
    breakfastMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0) +
    lunchMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0) +
    dinnerMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

  return {
    totalCredits,
    mealCredits,
    extraCredits,
    cheatCreditsUsed,
    netCredits,
    totalCalories,
    breakfastMeals,
    lunchMeals,
    dinnerMeals,
    // Legacy fields
    breakfastMeal: breakfastMeals[0],
    lunchMeal: lunchMeals[0],
    dinnerMeal: dinnerMeals[0],
  };
};

export const calculateDailyCredits = (log: DailyLog): number => {
  const summary = calculateDailySummary(log);
  return summary.netCredits;
};

export const calculateDailyCalories = (log: DailyLog): number => {
  const summary = calculateDailySummary(log);
  return summary.totalCalories;
};

