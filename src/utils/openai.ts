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
  if (log.breakfast && log.breakfast.length > 0) {
    meals.push(`Breakfast: ${log.breakfast.length} meal(s) logged`);
  }
  if (log.lunch && log.lunch.length > 0) {
    meals.push(`Lunch: ${log.lunch.length} meal(s) logged`);
  }
  if (log.dinner && log.dinner.length > 0) {
    meals.push(`Dinner: ${log.dinner.length} meal(s) logged`);
  }
  
  // Legacy support
  if (meals.length === 0) {
    if (log.breakfastId) meals.push(`Breakfast: logged`);
    if (log.lunchId) meals.push(`Lunch: logged`);
    if (log.dinnerId) meals.push(`Dinner: logged`);
  }
  
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
1. Understand what meals the user has already eaten today (or plans to eat)
2. Suggest the NEXT meals they need - be contextual:
   - If they mention breakfast → suggest lunch & dinner
   - If they mention lunch → suggest dinner
   - If they mention the whole day or it's late evening → suggest tomorrow's breakfast, lunch, AND dinner

CONVERSATION CONTEXT:
- You will receive previous messages in the conversation for context
- Use this history to understand what the user has already told you
- Build on previous suggestions and adapt recommendations based on follow-up questions
- If the user asks to change something, update your suggestions accordingly

MEAL LIBRARY (available meals with IDs):
${mealLibrary}

IMPORTANT MATCHING GUIDELINES:
- Each meal in the library has a unique name and specific ingredients
- Only match if the user's meal description matches BOTH the name AND key ingredients
- If the user describes a variation (e.g., "stuffed chilla" vs "plain chilla", "on toast" vs "with roti"), it's a DIFFERENT meal - create new
- When creating new meals, use the EXACT name and description the user provided
- Don't substitute similar items (chilla ≠ toast ≠ paratha) - they are different meals

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
  NOTE: Number of suggestions varies (1-3) based on what meals are needed next
}

RULES:
1. For "alreadyHad": Include ALL meals the user mentions they had.
   - MATCHING CRITERIA: Only use a mealId from the library if the user's meal is CLEARLY and EXACTLY the same meal.
   - If the user describes a meal that is similar but not identical (different ingredients, preparation, or name), set mealId to null and isNew to true.
   - When in doubt, CREATE A NEW MEAL (mealId: null, isNew: true). It's better to create a new meal than to misidentify.
   - Examples of MISMATCHES (should create new meal):
     * User says "mixed-dal chilla" but library has "moong dal chilla" → CREATE NEW
     * User says "paneer bhurji on toast" but library has "paneer bhurji with roti" → CREATE NEW
     * User says "stuffed chilla" but library has "plain chilla" → CREATE NEW
   - Only match if the meal name and key ingredients are EXACTLY the same.

2. For "suggestions": Provide CONTEXTUAL suggestions based on what the user has told you:
   
   CONTEXTUAL SUGGESTION RULES:
   - If user mentions ONLY breakfast → Suggest lunch AND dinner (2 suggestions total)
   - If user mentions breakfast + lunch OR only lunch → Suggest dinner (1 suggestion)
   - If user mentions the whole day OR it's late evening (after 8 PM) → Suggest tomorrow's breakfast, lunch, AND dinner (3 suggestions)
   - If user mentions breakfast + lunch + dinner → Suggest tomorrow's breakfast, lunch, AND dinner (3 suggestions)
   
   SUGGESTION COMPOSITION:
   - For each time slot you're suggesting, provide 1-2 options:
     * At least 1 suggestion from the existing meal library (use mealId)
     * Optionally 1 new meal suggestion (mealId: null, isNew: true) if you think a new meal would be helpful
   - Total suggestions should match the number of meals needed (1-3 suggestions)
   - For new meals, use the EXACT name and description that would be appropriate
   - Consider nutritional balance when suggesting meals

3. Consider nutritional balance when suggesting meals

4. Time-based logic:
   - Current time determines which meals are "next"
   - Morning (before 11 AM): Next meals are lunch and dinner
   - Afternoon (11 AM - 4 PM): Next meal is dinner
   - Evening (after 4 PM): Next meals are tomorrow's breakfast, lunch, and dinner
   - Late evening (after 8 PM): Always suggest tomorrow's full day (breakfast, lunch, dinner)

5. Match meal types to appropriate times based on the current timestamp (breakfast in morning, etc.)

6. Always include ingredients and steps for new meals - use the user's description to create accurate ingredients and steps

7. For healthy meals: credits should be 1-3 based on nutritional value (3 = very healthy, high protein; 1 = less healthy)

8. For unhealthy/cheat meals: 
   - Type MUST be "cheat"
   - Credits MUST be STRONGLY NEGATIVE and PUNITIVE (-5 to -15 or more)
   - The more unhealthy, the more negative (make it costly!)
   - Examples: ice cream (-5), pizza (-8), burger (-10), deep fried items (-12), very unhealthy desserts (-15)

9. IMPORTANT: When creating new meals, preserve the user's exact wording and description. Don't change "chilla" to "toast" or "paratha" - use what the user said.`;
};

/**
 * Call the API (proxy in production, direct in development)
 * @param userMessage - The current user message
 * @param conversationHistory - Previous messages in the conversation (optional)
 */
export const callChatGPT = async (
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<ChatResponse> => {
  const systemPrompt = buildSystemPrompt();
  
  // Build messages array with system prompt, conversation history, and current message
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];
  
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
          messages,
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
          messages,
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
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
  maxRetries: number = 2
): Promise<ChatResponse> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callChatGPT(userMessage, conversationHistory);
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
