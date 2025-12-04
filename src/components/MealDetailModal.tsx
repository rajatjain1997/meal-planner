import { useState } from "react";
import type { Meal } from "../types";
import { logMealForToday } from "../utils/storage";
import { getCurrentMealType } from "../utils/time";

interface MealDetailModalProps {
  meal: Meal;
  onClose: () => void;
  onMealLogged?: () => void;
}

const creditColors: Record<number, string> = {
  1: "bg-emerald-100 text-emerald-700 border-emerald-200",
  2: "bg-amber-100 text-amber-700 border-amber-200",
  3: "bg-orange-100 text-orange-700 border-orange-200",
};

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

const mealTypeIcons: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
};

export const MealDetailModal = ({ meal, onClose, onMealLogged }: MealDetailModalProps) => {
  const [cooking, setCooking] = useState(false);
  const [cooked, setCooked] = useState(false);
  const currentMealType = getCurrentMealType();
  const isCurrentMealType = meal.type === currentMealType;

  const handleCook = () => {
    setCooking(true);
    logMealForToday(meal.id, meal.type);
    setCooked(true);
    setCooking(false);
    
    // Call callback if provided
    if (onMealLogged) {
      setTimeout(() => {
        onMealLogged();
        onClose();
      }, 1500);
    } else {
      setTimeout(() => {
        setCooked(false);
      }, 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{mealTypeIcons[meal.type]}</span>
              <div>
                <span className="text-xs uppercase tracking-wider opacity-80">
                  {meal.type}
                </span>
                <h2 className="text-2xl font-bold leading-tight">{meal.name}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold border ${creditColors[meal.credits]}`}
            >
              {meal.credits} Credits
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              {meal.calories} cal
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[meal.difficulty]}`}
            >
              {meal.difficulty}
            </span>
          </div>
        </div>

        {/* Cook Button */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
          {cooked ? (
            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Meal logged for today!</span>
            </div>
          ) : (
            <button
              onClick={handleCook}
              disabled={cooking}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all ${
                isCurrentMealType
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-200"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-orange-200"
              } ${cooking ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              {cooking ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Logging...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🍳</span>
                  {isCurrentMealType ? "Cook Now" : `Log as ${meal.type}`}
                </span>
              )}
            </button>
          )}
          {!isCurrentMealType && !cooked && (
            <p className="text-xs text-stone-500 text-center mt-2">
              Note: This is a {meal.type} meal, but it's currently {currentMealType} time
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Tags */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {meal.cuisines.map((cuisine) => (
                <span
                  key={cuisine}
                  className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm font-medium"
                >
                  {cuisine}
                </span>
              ))}
              {meal.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                🥗
              </span>
              Ingredients
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {meal.ingredients.map((ingredient, idx) => (
                <li key={idx} className="flex items-start gap-2 text-stone-600">
                  <span className="text-orange-400 mt-1">•</span>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div>
            <h3 className="text-lg font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                📝
              </span>
              Steps
            </h3>
            <ol className="space-y-3">
              {meal.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-stone-600 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

