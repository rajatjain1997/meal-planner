import type { Meal, SavedChatMeal, SuggestedMeal, AlreadyHadMeal, MealType } from "../types";
import { meals as originalMeals } from "../data/meals";

const STORAGE_KEY = "chatMeals";
const ID_COUNTER_KEY = "chatMealIdCounter";

/**
 * Get the next available chat meal ID
 */
const getNextChatMealId = (): string => {
  const counter = parseInt(localStorage.getItem(ID_COUNTER_KEY) || "0", 10);
  const nextId = counter + 1;
  localStorage.setItem(ID_COUNTER_KEY, nextId.toString());
  return `CHAT${nextId}`;
};

/**
 * Load all saved chat meals from localStorage
 */
export const loadSavedChatMeals = (): SavedChatMeal[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as SavedChatMeal[];
  } catch {
    console.error("Failed to load chat meals from localStorage");
    return [];
  }
};

/**
 * Save a new chat meal to localStorage
 */
export const saveChatMeal = (meal: Omit<SavedChatMeal, "id" | "savedAt" | "source">): SavedChatMeal => {
  const chatMeals = loadSavedChatMeals();
  
  const newMeal: SavedChatMeal = {
    ...meal,
    id: getNextChatMealId(),
    savedAt: new Date().toISOString(),
    source: "chat",
  };
  
  chatMeals.push(newMeal);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatMeals));
    window.dispatchEvent(new Event("chatMealsUpdated"));
  } catch {
    console.error("Failed to save chat meal to localStorage");
  }
  
  return newMeal;
};

/**
 * Get complete meal library (original 45 meals + all saved chat meals)
 */
export const getCompleteMealLibrary = (): Meal[] => {
  const chatMeals = loadSavedChatMeals();
  return [...originalMeals, ...chatMeals];
};

/**
 * Get meals by type including chat meals
 */
export const getMealsByTypeIncludingChat = (type: MealType): Meal[] => {
  const allMeals = getCompleteMealLibrary();
  return allMeals.filter((meal) => meal.type === type);
};

/**
 * Get a meal by ID from complete library
 */
export const getMealByIdFromLibrary = (id: string): Meal | undefined => {
  const allMeals = getCompleteMealLibrary();
  return allMeals.find((meal) => meal.id === id);
};

/**
 * Convert SuggestedMeal to Meal format and save
 */
export const saveSuggestedMealToLibrary = (suggested: SuggestedMeal): SavedChatMeal => {
  // Convert type to MealType (cheat meals become dinner type for storage)
  const mealType: MealType = suggested.type === "cheat" ? "dinner" : suggested.type;
  
  return saveChatMeal({
    name: suggested.name,
    type: mealType,
    credits: suggested.credits,
    calories: suggested.calories,
    difficulty: "medium", // Default difficulty for chat meals
    cuisines: ["Custom"],
    tags: suggested.type === "cheat" ? ["cheat"] : [],
    ingredients: suggested.ingredients,
    steps: suggested.steps,
  });
};

/**
 * Convert AlreadyHadMeal to Meal format and save
 */
export const saveAlreadyHadMealToLibrary = (alreadyHad: AlreadyHadMeal): SavedChatMeal => {
  // Convert type to MealType (cheat meals become dinner type for storage)
  const mealType: MealType = alreadyHad.type === "cheat" ? "dinner" : alreadyHad.type;
  
  return saveChatMeal({
    name: alreadyHad.name,
    type: mealType,
    credits: alreadyHad.credits,
    calories: alreadyHad.calories,
    difficulty: "medium", // Default difficulty for chat meals
    cuisines: ["Custom"],
    tags: alreadyHad.type === "cheat" ? ["cheat"] : [],
    ingredients: alreadyHad.ingredients,
    steps: alreadyHad.steps,
  });
};

/**
 * Delete a saved chat meal
 */
export const deleteChatMeal = (id: string): void => {
  const chatMeals = loadSavedChatMeals().filter((meal) => meal.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatMeals));
    window.dispatchEvent(new Event("chatMealsUpdated"));
  } catch {
    console.error("Failed to delete chat meal from localStorage");
  }
};

/**
 * Get meal library as JSON string for API context
 */
export const getMealLibraryForContext = (): string => {
  const allMeals = getCompleteMealLibrary();
  // Include relevant fields for context - ingredients help with accurate matching
  const simplifiedMeals = allMeals.map((meal) => ({
    id: meal.id,
    name: meal.name,
    type: meal.type,
    credits: meal.credits,
    calories: meal.calories,
    cuisines: meal.cuisines,
    tags: meal.tags,
    ingredients: meal.ingredients.slice(0, 5), // Include first 5 ingredients for matching
  }));
  return JSON.stringify(simplifiedMeals, null, 2);
};

