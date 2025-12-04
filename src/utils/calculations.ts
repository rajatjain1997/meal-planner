import type { DailyLog, Meal } from "../types";
import { getMealById } from "../data/meals";

export interface DailySummary {
  totalCredits: number;
  mealCredits: number;
  extraCredits: number;
  cheatCreditsUsed: number;
  netCredits: number;
  totalCalories: number;
  breakfastMeal?: Meal;
  lunchMeal?: Meal;
  dinnerMeal?: Meal;
}

export const calculateDailySummary = (log: DailyLog): DailySummary => {
  const breakfastMeal = log.breakfastId ? getMealById(log.breakfastId) : undefined;
  const lunchMeal = log.lunchId ? getMealById(log.lunchId) : undefined;
  const dinnerMeal = log.dinnerId ? getMealById(log.dinnerId) : undefined;

  const mealCredits =
    (breakfastMeal?.credits || 0) +
    (lunchMeal?.credits || 0) +
    (dinnerMeal?.credits || 0);

  const extraCredits = log.extraCredits || 0;
  const cheatCreditsUsed = log.cheatCreditsUsed || 0;

  const totalCredits = mealCredits + extraCredits;
  const netCredits = totalCredits - cheatCreditsUsed;

  const totalCalories =
    (breakfastMeal?.calories || 0) +
    (lunchMeal?.calories || 0) +
    (dinnerMeal?.calories || 0);

  return {
    totalCredits,
    mealCredits,
    extraCredits,
    cheatCreditsUsed,
    netCredits,
    totalCalories,
    breakfastMeal,
    lunchMeal,
    dinnerMeal,
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

