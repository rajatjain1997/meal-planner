export type MealType = "breakfast" | "lunch" | "dinner";

export type Difficulty = "easy" | "medium" | "hard";

export interface Meal {
  id: string; // e.g. "B1", "L3", "D10"
  name: string;
  type: MealType;
  credits: number; // 1, 2, or 3
  calories: number; // approximate per serving
  difficulty: Difficulty;
  cuisines: string[]; // ["Indian"], ["Japanese"], ["Mexican"], etc.
  tags: string[]; // ["high-protein", "soup", "bowl", "salad", ...]
  ingredients: string[];
  steps: string[];
}

export interface DailyLog {
  date: string; // ISO date "YYYY-MM-DD"
  breakfastId?: string;
  lunchId?: string;
  dinnerId?: string;
  breakfastTime?: string; // ISO timestamp
  lunchTime?: string; // ISO timestamp
  dinnerTime?: string; // ISO timestamp
  extraCredits?: number; // e.g. set bonus
  cheatCreditsUsed?: number; // credits spent on junk/cheats
  notes?: string;
}

export interface CheatMeal {
  id: string;
  name: string;
  category: string; // "snacks", "desserts", "drinks", "fast-food", etc.
  creditCost: number; // credits required to "buy" this
  calories: number;
  description?: string;
}

export interface MealPlan {
  date: string; // ISO date "YYYY-MM-DD"
  breakfastId: string;
  lunchId: string;
  dinnerId: string;
  committedAt?: string; // ISO timestamp when user committed to this plan
}

export interface MealPlanOption {
  breakfastId: string;
  lunchId: string;
  dinnerId: string;
}

