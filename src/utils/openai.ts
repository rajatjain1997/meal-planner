import type { ChatResponse } from "../types";
import { getMealLibraryForContext } from "./chatMeals";
import { getDailyLog, getTodayDateString } from "./storage";

// In development, use direct OpenAI API (with VITE_OPENAI_API_KEY)
// In production, use the Vercel serverless function proxy
const isDevelopment = import.meta.env.DEV;
const API_PROXY_URL = "/api/chat";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Get the current time context string with ISO timestamp
 */
const getTimeContext = (): string => {
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay = hour < 11 ? "morning (breakfast time)" : hour < 16 ? "afternoon (lunch time)" : "evening (dinner time)";
  const isoTimestamp = now.toISOString();
  return `Current device timestamp: ${isoTimestamp}\nCurrent time: ${now.toLocaleTimeString()} (${timeOfDay})`;
};

/**
 * Get today's logged meals context
 */
const getTodaysMealsContext = (): string => {
  const today = getTodayDateString();
  const log = getDailyLog(today);
  
  if (!log) {
    return "No meals logged today yet.";
  }
  
  const meals: string[] = [];
  if (log.breakfastId) meals.push(`Breakfast: ${log.breakfastId}`);
  if (log.lunchId) meals.push(`Lunch: ${log.lunchId}`);
  if (log.dinnerId) meals.push(`Dinner: ${log.dinnerId}`);
  
  if (meals.length === 0) {
    return "No meals logged today yet.";
  }
  
  return `Today's logged meals:\n${meals.join("\n")}`;
};

/**
 * Build the system prompt for ChatGPT
 */
const buildSystemPrompt = (): string => {
  const mealLibrary = getMealLibraryForContext();
  const timeContext = getTimeContext();
  const todaysMeals = getTodaysMealsContext();
  
  return `You are a helpful vegetarian meal planning assistant for a family. Your job is to:
1. Understand what meals the user has already eaten today
2. Suggest balanced meals for the rest of the day or next day

MEAL LIBRARY (available meals with IDs):
${mealLibrary}

${timeContext}
${todaysMeals}

CREDIT SYSTEM:
- Healthy meals earn positive credits (1-3 credits based on nutritional value)
- Unhealthy/cheat meals have PUNITIVE NEGATIVE credits (typically -5 to -15, can be even more for very unhealthy items)
- Meal types: breakfast, lunch, dinner, cheat
- Type "cheat" MUST be used for unhealthy meals (junk food, desserts, fried foods, etc.)
- For cheat meals: credits should be STRONGLY NEGATIVE and PUNITIVE (e.g., -5 for ice cream, -8 for pizza, -10 for burger, -15 for very unhealthy items)
- The goal is to make cheat meals costly so users can only cheat occasionally
- For healthy meals: credits should be POSITIVE (e.g., 1, 2, 3)
- Breakfast (5 AM - 11 AM), Lunch (11 AM - 4 PM), Dinner (4 PM onwards)

RESPONSE FORMAT:
You MUST respond with valid JSON only. No additional text outside the JSON.

{
  "message": "Your natural language explanation and dietary advice here",
  "alreadyHad": [
    {
      "mealId": "B1" or null if not in library,
      "name": "Meal name",
      "credits": 1-3 for healthy meals, -5 to -15 (or more) for cheat meals (punitive),
      "type": "breakfast|lunch|dinner|cheat",
      "isNew": true if not in library else false,
      "calories": approximate number,
      "ingredients": ["ingredient1", "ingredient2"],
      "steps": ["step1", "step2"]
    }
  ],
  "suggestions": [
    {
      "mealId": "L5" or null if new meal,
      "name": "Meal name",
      "type": "breakfast|lunch|dinner|cheat",
      "credits": 1-3 for healthy meals, -5 to -15 (or more) for cheat meals (punitive),
      "calories": number,
      "ingredients": ["ingredient1", "ingredient2"],
      "steps": ["step1", "step2"],
      "isNew": true if new suggestion else false,
      "description": "Why this meal balances the diet"
    }
  ]
}

RULES:
1. For "alreadyHad": Include ALL meals the user mentions they had. If a meal matches one in the library, use its mealId. If not, set mealId to null and isNew to true.
2. For "suggestions": Provide EXACTLY 3 suggestions:
   - 2 suggestions MUST be from the existing meal library (use their mealId)
   - 1 suggestion should be a NEW meal not in the library (mealId: null, isNew: true)
3. Consider nutritional balance when suggesting meals
4. If it's late evening, suggest meals for tomorrow
5. Match meal types to appropriate times based on the current timestamp (breakfast in morning, etc.)
6. Always include ingredients and steps for new meals
7. For healthy meals: credits should be 1-3 based on nutritional value (3 = very healthy, high protein; 1 = less healthy)
8. For unhealthy/cheat meals: 
   - Type MUST be "cheat"
   - Credits MUST be STRONGLY NEGATIVE and PUNITIVE (-5 to -15 or more)
   - The more unhealthy, the more negative (make it costly!)
   - Examples: ice cream (-5), pizza (-8), burger (-10), deep fried items (-12), very unhealthy desserts (-15)`;
};

/**
 * Call the API (proxy in production, direct in development)
 */
export const callChatGPT = async (userMessage: string): Promise<ChatResponse> => {
  const systemPrompt = buildSystemPrompt();
  
  let response: Response;
  
  if (isDevelopment) {
    // Development: Use direct OpenAI API with VITE_OPENAI_API_KEY
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey || apiKey === "sk-your-api-key-here") {
      throw new Error("OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env.local file.");
    }
    
    try {
      response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });
    } catch (fetchError) {
      throw new Error("Failed to connect to OpenAI. Please check your internet connection.");
    }
  } else {
    // Production: Use Vercel serverless function proxy
    try {
      response = await fetch(API_PROXY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      });
    } catch (fetchError) {
      throw new Error("Failed to connect to server. Please check your internet connection.");
    }
  }
  
  // Get response text first
  const responseText = await response.text();
  
  // Try to parse as JSON
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    console.error("Failed to parse response:", responseText);
    throw new Error(`Server error: ${response.status}. Please try again.`);
  }
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid API key. Please check your configuration.");
    }
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.");
    }
    throw new Error(data.error || `API error: ${response.status}`);
  }
  
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("No response content from ChatGPT");
  }
  
  // Parse the JSON response
  try {
    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as ChatResponse;
    
    // Validate the response structure
    if (!parsed.message || !Array.isArray(parsed.alreadyHad) || !Array.isArray(parsed.suggestions)) {
      throw new Error("Invalid response structure");
    }
    
    return parsed;
  } catch (parseError) {
    console.error("Failed to parse ChatGPT response:", content);
    throw new Error("Failed to parse ChatGPT response. Please try again.");
  }
};

/**
 * Retry wrapper for API calls
 */
export const callChatGPTWithRetry = async (
  userMessage: string,
  maxRetries: number = 2
): Promise<ChatResponse> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callChatGPT(userMessage);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on auth errors or rate limits
      if (lastError.message.includes("API key") || lastError.message.includes("Rate limit")) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError || new Error("Failed after retries");
};
