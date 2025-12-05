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

export interface LoggedMeal {
  mealId: string;
  timestamp: string; // ISO timestamp when meal was logged
}

export interface DailyLog {
  date: string; // ISO date "YYYY-MM-DD"
  breakfast?: LoggedMeal[]; // Array of meals logged for breakfast time
  lunch?: LoggedMeal[]; // Array of meals logged for lunch time
  dinner?: LoggedMeal[]; // Array of meals logged for dinner time
  // Legacy fields for backward compatibility (will be migrated)
  breakfastId?: string;
  lunchId?: string;
  dinnerId?: string;
  breakfastTime?: string;
  lunchTime?: string;
  dinnerTime?: string;
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

// Chat types for ChatGPT integration
export type ChatMealType = MealType | "cheat";

export interface AlreadyHadMeal {
  mealId: string | null; // null if meal doesn't exist in library
  name: string;
  credits: number; // 1-3 for healthy meals, -1 to -3 for cheat meals
  type: ChatMealType;
  isNew: boolean; // true if meal was not in database
  calories: number;
  ingredients: string[];
  steps: string[];
}

export interface SuggestedMeal {
  mealId: string | null; // null if new meal
  name: string;
  type: ChatMealType;
  credits: number; // 1-3 for healthy meals, -1 to -3 for cheat meals
  calories: number;
  ingredients: string[];
  steps: string[];
  isNew: boolean;
  description: string; // Why this balances diet
}

export interface ChatResponse {
  message: string; // Natural language explanation
  alreadyHad: AlreadyHadMeal[];
  suggestions: SuggestedMeal[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  response?: ChatResponse; // Only for assistant messages
}

export interface SavedChatMeal extends Meal {
  savedAt: string; // ISO timestamp
  source: "chat"; // Indicates this meal was added via chat
}

