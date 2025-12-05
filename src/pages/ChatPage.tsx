import { useState, useRef, useEffect } from "react";
import type { ChatMessage, AlreadyHadMeal, SuggestedMeal } from "../types";
import { callChatGPTWithRetry } from "../utils/openai";
import { 
  saveSuggestedMealToLibrary, 
  saveAlreadyHadMealToLibrary
} from "../utils/chatMeals";
import { getTodayDateString, logMealForToday, loadTodayChatMessages, saveTodayChatMessages } from "../utils/storage";
import { saveMealPlan, getMealPlan, getNextDayDateString } from "../utils/plans";

export const ChatPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredMeals, setRegisteredMeals] = useState<Set<string>>(new Set());
  const [savedMeals, setSavedMeals] = useState<Set<string>>(new Set());
  const [addedToPlans, setAddedToPlans] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load today's chat messages on mount
  useEffect(() => {
    const savedMessages = loadTodayChatMessages();
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
      // Note: We don't restore registered/saved/added states perfectly,
      // but the meals themselves are already saved in the log/library
    }
  }, []);

  // Save messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveTodayChatMessages(messages);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history from previous messages
      const conversationHistory = messages
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.role === "assistant" ? msg.content : msg.content,
        }));

      const response = await callChatGPTWithRetry(userMessage.content, conversationHistory);
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.message,
        timestamp: new Date().toISOString(),
        response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterMeal = (meal: AlreadyHadMeal, messageId: string) => {
    const mealKey = `${messageId}-${meal.name}`;
    if (registeredMeals.has(mealKey)) return;
    
    let mealId = meal.mealId;
    
    // If it's a new meal, save it to library first
    if (meal.isNew || !mealId) {
      const savedMeal = saveAlreadyHadMealToLibrary(meal);
      mealId = savedMeal.id;
    }

    // Determine which meal slot to use based on CURRENT TIME (not meal type)
    const now = new Date();
    const hour = now.getHours();
    
    // Time-based slot assignment (meal type doesn't matter)
    let mealTypeForSlot: "breakfast" | "lunch" | "dinner";
    if (hour < 11) {
      mealTypeForSlot = "breakfast";
    } else if (hour < 16) {
      mealTypeForSlot = "lunch";
    } else {
      mealTypeForSlot = "dinner";
    }
    
    // Use the new append-based logging function
    logMealForToday(mealId, mealTypeForSlot);
    setRegisteredMeals((prev) => new Set([...prev, mealKey]));
    
    // Dispatch event to update credits display
    window.dispatchEvent(new Event("mealCreditsUpdated"));
  };

  const handleSaveMeal = (meal: SuggestedMeal, messageId: string) => {
    const mealKey = `${messageId}-${meal.name}`;
    if (savedMeals.has(mealKey)) return;

    saveSuggestedMealToLibrary(meal);
    setSavedMeals((prev) => new Set([...prev, mealKey]));
  };

  const handleAddToPlan = (meal: SuggestedMeal, messageId: string) => {
    const mealKey = `${messageId}-${meal.name}`;
    if (addedToPlans.has(mealKey)) return;

    const hour = new Date().getHours();
    const isLateEvening = hour >= 20; // After 8 PM, plan for tomorrow
    const targetDate = isLateEvening ? getNextDayDateString() : getTodayDateString();
    
    let mealId = meal.mealId;
    
    // If it's a new meal, save it to library first
    if (meal.isNew || !mealId) {
      const savedMeal = saveSuggestedMealToLibrary(meal);
      mealId = savedMeal.id;
    }

    // Get existing plan or create new one
    const existingPlan = getMealPlan(targetDate);
    
    // Determine which meal slot based on type
    const mealType = meal.type === "cheat" ? "dinner" : meal.type;
    
    if (existingPlan) {
      // Update existing plan
      const updatedPlan = { ...existingPlan };
      if (mealType === "breakfast") updatedPlan.breakfastId = mealId;
      else if (mealType === "lunch") updatedPlan.lunchId = mealId;
      else updatedPlan.dinnerId = mealId;
      
      saveMealPlan(updatedPlan);
    } else {
      // Create new plan with this meal
      const newPlan = {
        date: targetDate,
        breakfastId: mealType === "breakfast" ? mealId : "",
        lunchId: mealType === "lunch" ? mealId : "",
        dinnerId: mealType === "dinner" || meal.type === "cheat" ? mealId : "",
        committedAt: new Date().toISOString(),
      };
      saveMealPlan(newPlan);
    }

    setAddedToPlans((prev) => new Set([...prev, mealKey]));
  };

  const getCreditColor = (credits: number): string => {
    if (credits < 0) {
      // Negative credits (cheat meals) - more negative = more red
      if (credits <= -10) {
        return "bg-red-900 text-red-100"; // Very punitive
      } else if (credits <= -7) {
        return "bg-red-700 text-red-100"; // Highly punitive
      } else if (credits <= -5) {
        return "bg-red-500 text-white"; // Punitive
      } else {
        return "bg-red-300 text-red-900"; // Less punitive
      }
    } else {
      // Positive credits (healthy meals)
      return credits === 3 
        ? "bg-orange-100 text-orange-700"
        : credits === 2
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";
    }
  };

  const typeIcons: Record<string, string> = {
    breakfast: "🌅",
    lunch: "☀️",
    dinner: "🌙",
    cheat: "🍰",
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px]">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-stone-200 p-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-stone-700 mb-2">
              Chat with AI Assistant
            </h3>
            <p className="text-stone-500 max-w-md">
              Tell me what you've eaten today, and I'll help you plan balanced meals
              and track your credits.
            </p>
            <div className="mt-4 text-sm text-stone-400">
              Try: "I had idli for breakfast and rajma for lunch"
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id}>
                {/* User Message */}
                {message.role === "user" && (
                  <div className="flex justify-end">
                    <div className="bg-orange-500 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                      {message.content}
                    </div>
                  </div>
                )}

                {/* Assistant Message */}
                {message.role === "assistant" && message.response && (
                  <div className="space-y-4">
                    {/* Natural Language Message */}
                    <div className="flex justify-start">
                      <div className="bg-stone-100 text-stone-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
                        {message.content}
                      </div>
                    </div>

                    {/* Already Had Section */}
                    {message.response.alreadyHad.length > 0 && (
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                          <span>🍽️</span> Meals You Had
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {message.response.alreadyHad.map((meal, idx) => {
                            const mealKey = `${message.id}-${meal.name}`;
                            const isRegistered = registeredMeals.has(mealKey);
                            
                            return (
                              <button
                                key={idx}
                                onClick={() => handleRegisterMeal(meal, message.id)}
                                disabled={isRegistered}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                                  isRegistered
                                    ? "bg-green-100 border-green-300 text-green-700 cursor-default"
                                    : "bg-white border-amber-300 hover:border-orange-400 hover:shadow-md cursor-pointer"
                                }`}
                              >
                                <span>{typeIcons[meal.type]}</span>
                                <span className="font-medium">{meal.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getCreditColor(meal.credits)}`}>
                                  {meal.credits > 0 ? '+' : ''}{meal.credits}★
                                </span>
                                {meal.isNew && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                    New
                                  </span>
                                )}
                                {meal.type === "cheat" && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                    Cheat
                                  </span>
                                )}
                                {isRegistered && (
                                  <span className="text-green-600 font-bold">✓ Registered</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                          Click to register meal (negative credits for cheat meals, positive for healthy meals)
                        </p>
                      </div>
                    )}

                    {/* Suggestions Section */}
                    {message.response.suggestions.length > 0 && (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                          <span>💡</span> Suggested Meals
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {message.response.suggestions.map((meal, idx) => {
                            const mealKey = `${message.id}-${meal.name}`;
                            const isAddedToPlan = addedToPlans.has(mealKey);
                            const isSaved = savedMeals.has(mealKey);
                            
                            return (
                              <div
                                key={idx}
                                className="bg-white rounded-xl p-4 border border-green-200 shadow-sm"
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">{typeIcons[meal.type]}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getCreditColor(meal.credits)}`}>
                                      {meal.credits > 0 ? '+' : ''}{meal.credits}★
                                    </span>
                                  </div>
                                  {meal.isNew ? (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                      New Suggestion
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full text-xs font-medium">
                                      From Library
                                    </span>
                                  )}
                                </div>
                                
                                <h5 className="font-semibold text-stone-800 mb-1">{meal.name}</h5>
                                <p className="text-xs text-stone-500 mb-2">{meal.calories} cal</p>
                                <p className="text-sm text-stone-600 mb-3 line-clamp-2">
                                  {meal.description}
                                </p>
                                
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAddToPlan(meal, message.id)}
                                    disabled={isAddedToPlan}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                      isAddedToPlan
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-md"
                                    }`}
                                  >
                                    {isAddedToPlan ? "✓ Added" : "Add to Plan"}
                                  </button>
                                  
                                  {meal.isNew && (
                                    <button
                                      onClick={() => handleSaveMeal(meal, message.id)}
                                      disabled={isSaved}
                                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                        isSaved
                                          ? "bg-blue-100 text-blue-700"
                                          : "bg-blue-500 text-white hover:bg-blue-600"
                                      }`}
                                    >
                                      {isSaved ? "✓" : "Save"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-stone-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-sm text-red-600 hover:underline mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell me what you've eaten today..."
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-xl border border-stone-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none disabled:bg-stone-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </span>
          ) : (
            "Send"
          )}
        </button>
      </form>
    </div>
  );
};

