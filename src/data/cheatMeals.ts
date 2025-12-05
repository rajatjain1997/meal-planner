import type { CheatMeal } from "../types";

export const cheatMeals: CheatMeal[] = [
  // Snacks (Light snacks: -5, Fried snacks: -7 to -8)
  {
    id: "C1",
    name: "Potato Chips (1 bag)",
    category: "snacks",
    creditCost: 6,
    calories: 150,
    description: "Crispy, salty, and oh-so-tempting",
  },
  {
    id: "C2",
    name: "Namkeen Mix (1 cup)",
    category: "snacks",
    creditCost: 7,
    calories: 200,
    description: "Assorted fried snacks",
  },
  {
    id: "C3",
    name: "Samosa (2 pcs)",
    category: "snacks",
    creditCost: 8,
    calories: 300,
    description: "Deep-fried pastry with spiced filling",
  },
  {
    id: "C4",
    name: "Pakora (5-6 pcs)",
    category: "snacks",
    creditCost: 7,
    calories: 280,
    description: "Fried fritters with vegetables",
  },
  {
    id: "C5",
    name: "Bhujia / Sev (1 cup)",
    category: "snacks",
    creditCost: 5,
    calories: 180,
    description: "Crispy gram flour noodles",
  },

  // Desserts (Moderate: -5 to -7, Very sweet: -8 to -10)
  {
    id: "C6",
    name: "Ice Cream (1 scoop)",
    category: "desserts",
    creditCost: 5,
    calories: 200,
    description: "Creamy frozen treat",
  },
  {
    id: "C7",
    name: "Gulab Jamun (2 pcs)",
    category: "desserts",
    creditCost: 8,
    calories: 250,
    description: "Sweet milk dumplings in syrup",
  },
  {
    id: "C8",
    name: "Jalebi (3-4 pcs)",
    category: "desserts",
    creditCost: 8,
    calories: 220,
    description: "Crispy spiral sweet",
  },
  {
    id: "C9",
    name: "Chocolate Bar (1 bar)",
    category: "desserts",
    creditCost: 5,
    calories: 150,
    description: "Your favorite chocolate",
  },
  {
    id: "C10",
    name: "Kaju Katli (3-4 pcs)",
    category: "desserts",
    creditCost: 6,
    calories: 180,
    description: "Cashew fudge",
  },
  {
    id: "C11",
    name: "Rasgulla (3 pcs)",
    category: "desserts",
    creditCost: 7,
    calories: 200,
    description: "Spongy cottage cheese balls in syrup",
  },
  {
    id: "C12",
    name: "Kulfi (1 stick)",
    category: "desserts",
    creditCost: 5,
    calories: 180,
    description: "Traditional Indian ice cream",
  },

  // Drinks (Moderate: -5, High sugar: -6 to -7)
  {
    id: "C13",
    name: "Cold Drink / Soda (1 can)",
    category: "drinks",
    creditCost: 6,
    calories: 140,
    description: "Carbonated soft drink",
  },
  {
    id: "C14",
    name: "Packaged Juice (1 box)",
    category: "drinks",
    creditCost: 5,
    calories: 120,
    description: "Sweetened fruit juice",
  },
  {
    id: "C15",
    name: "Milkshake (1 glass)",
    category: "drinks",
    creditCost: 7,
    calories: 300,
    description: "Creamy milkshake",
  },
  {
    id: "C16",
    name: "Lassi (Sweet, 1 glass)",
    category: "drinks",
    creditCost: 5,
    calories: 200,
    description: "Sweet yogurt drink",
  },

  // Fast Food / Restaurant (Very punitive: -8 to -12)
  {
    id: "C17",
    name: "Pizza Slice (1 slice)",
    category: "fast-food",
    creditCost: 8,
    calories: 300,
    description: "Cheesy pizza slice",
  },
  {
    id: "C18",
    name: "Burger (1 veg burger)",
    category: "fast-food",
    creditCost: 10,
    calories: 350,
    description: "Fast food burger",
  },
  {
    id: "C19",
    name: "French Fries (1 medium)",
    category: "fast-food",
    creditCost: 8,
    calories: 320,
    description: "Crispy fried potatoes",
  },
  {
    id: "C20",
    name: "Pav Bhaji (1 plate)",
    category: "fast-food",
    creditCost: 9,
    calories: 400,
    description: "Spiced vegetable curry with bread",
  },
  {
    id: "C21",
    name: "Vada Pav (2 pcs)",
    category: "fast-food",
    creditCost: 8,
    calories: 350,
    description: "Mumbai street food",
  },
  {
    id: "C22",
    name: "Dosa (Restaurant style, 1)",
    category: "fast-food",
    creditCost: 7,
    calories: 280,
    description: "Crispy crepe from restaurant",
  },

  // Sweets / Mithai (Moderate to high: -6 to -9)
  {
    id: "C23",
    name: "Ladoo (2 pcs)",
    category: "sweets",
    creditCost: 8,
    calories: 250,
    description: "Sweet round balls",
  },
  {
    id: "C24",
    name: "Barfi (2-3 pcs)",
    category: "sweets",
    creditCost: 6,
    calories: 200,
    description: "Milk-based fudge",
  },
  {
    id: "C25",
    name: "Halwa (1 small bowl)",
    category: "sweets",
    creditCost: 7,
    calories: 300,
    description: "Sweet semolina pudding",
  },
];

export const getCheatMealById = (id: string): CheatMeal | undefined => {
  return cheatMeals.find((meal) => meal.id === id);
};

export const getCheatMealsByCategory = (category: string): CheatMeal[] => {
  return cheatMeals.filter((meal) => meal.category === category);
};

export const cheatCategories = [
  "snacks",
  "desserts",
  "drinks",
  "fast-food",
  "sweets",
];

