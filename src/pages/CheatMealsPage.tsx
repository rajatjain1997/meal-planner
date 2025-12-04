import { useState, useMemo } from "react";
import { cheatMeals } from "../data/cheatMeals";
import type { CheatMeal } from "../types";
import { getDailyLog, getTodayDateString, saveDailyLog } from "../utils/storage";
import { calculateDailySummary } from "../utils/calculations";

export const CheatMealsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [purchased, setPurchased] = useState<string | null>(null);

  const today = getTodayDateString();
  const todayLog = getDailyLog(today);
  const summary = todayLog ? calculateDailySummary(todayLog) : null;
  const availableCredits = summary?.netCredits || 0;

  const filteredMeals = useMemo(() => {
    if (selectedCategory === "all") return cheatMeals;
    return cheatMeals.filter((meal) => meal.category === selectedCategory);
  }, [selectedCategory]);

  const handlePurchase = (cheatMeal: CheatMeal) => {
    if (availableCredits < cheatMeal.creditCost) {
      alert(`Not enough credits! You need ${cheatMeal.creditCost} credits but only have ${availableCredits}.`);
      return;
    }

    const currentLog = todayLog || { date: today };
    const newCheatCredits =
      (currentLog.cheatCreditsUsed || 0) + cheatMeal.creditCost;

    const updatedLog = {
      ...currentLog,
      cheatCreditsUsed: newCheatCredits,
    };

    saveDailyLog(updatedLog);
    setPurchased(cheatMeal.id);
    setTimeout(() => setPurchased(null), 2000);
  };

  const categoryLabels: Record<string, string> = {
    all: "All Cheat Meals",
    snacks: "🍿 Snacks",
    desserts: "🍰 Desserts",
    drinks: "🥤 Drinks",
    "fast-food": "🍔 Fast Food",
    sweets: "🍬 Sweets",
  };

  const creditColor = (cost: number) => {
    if (cost === 1) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (cost === 2) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-orange-100 text-orange-700 border-orange-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-stone-800">Cheat Meals</h2>
            <p className="text-stone-500 text-sm">
              Spend your earned credits on treats
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-600 font-medium">Available Credits</p>
              <p
                className={`text-2xl font-bold ${
                  availableCredits >= 7
                    ? "text-green-600"
                    : availableCredits >= 5
                    ? "text-amber-600"
                    : "text-red-500"
                }`}
              >
                {availableCredits} ★
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryLabels).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Warning if low credits */}
      {availableCredits < 3 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-medium">
              Low credits! You need to earn more by eating healthy meals.
            </p>
          </div>
        </div>
      )}

      {/* Cheat Meals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMeals.map((meal) => {
          const canAfford = availableCredits >= meal.creditCost;
          const isPurchased = purchased === meal.id;

          return (
            <div
              key={meal.id}
              className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                canAfford
                  ? "border-stone-200 hover:border-orange-300 hover:shadow-lg"
                  : "border-stone-100 opacity-60"
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-800 text-lg mb-1">
                      {meal.name}
                    </h3>
                    {meal.description && (
                      <p className="text-sm text-stone-500">{meal.description}</p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold border ${creditColor(
                      meal.creditCost
                    )}`}
                  >
                    {meal.creditCost} ★
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
                  <span className="text-sm text-stone-500">
                    {meal.calories} cal
                  </span>
                  <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-medium">
                    {meal.category}
                  </span>
                </div>
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={() => handlePurchase(meal)}
                  disabled={!canAfford || isPurchased}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    isPurchased
                      ? "bg-green-500 text-white"
                      : canAfford
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-orange-200"
                      : "bg-stone-200 text-stone-400 cursor-not-allowed"
                  }`}
                >
                  {isPurchased ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Purchased!
                    </span>
                  ) : canAfford ? (
                    `Purchase for ${meal.creditCost} ★`
                  ) : (
                    `Need ${meal.creditCost} ★ (have ${availableCredits})`
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMeals.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
          <div className="text-6xl mb-4">🍰</div>
          <h3 className="text-xl font-semibold text-stone-700 mb-2">
            No cheat meals in this category
          </h3>
          <p className="text-stone-500">
            Try selecting a different category
          </p>
        </div>
      )}
    </div>
  );
};

