import type { Meal } from "../types";

interface MealCardProps {
  meal: Meal;
  onClick?: () => void;
  compact?: boolean;
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

export const MealCard = ({ meal, onClick, compact = false }: MealCardProps) => {
  if (compact) {
    return (
      <div
        onClick={onClick}
        className="p-3 bg-white rounded-lg border border-stone-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{mealTypeIcons[meal.type]}</span>
            <span className="font-medium text-stone-800 truncate">{meal.name}</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold border ${creditColors[meal.credits]}`}
          >
            {meal.credits}★
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
          <span>{meal.calories} cal</span>
          <span className={`px-1.5 py-0.5 rounded ${difficultyColors[meal.difficulty]}`}>
            {meal.difficulty}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-stone-200 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300 overflow-hidden cursor-pointer"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{mealTypeIcons[meal.type]}</span>
            <span className="text-xs font-medium uppercase tracking-wide text-stone-400">
              {meal.type}
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-bold border ${creditColors[meal.credits]}`}
          >
            {meal.credits} ★
          </span>
        </div>

        <h3 className="font-semibold text-stone-800 text-lg leading-tight mb-3 group-hover:text-orange-600 transition-colors">
          {meal.name}
        </h3>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-sm text-stone-600 font-medium">
            {meal.calories} cal
          </span>
          <span className="text-stone-300">•</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[meal.difficulty]}`}
          >
            {meal.difficulty}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {meal.cuisines.map((cuisine) => (
            <span
              key={cuisine}
              className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full text-xs"
            >
              {cuisine}
            </span>
          ))}
        </div>

        {meal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {meal.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-xs"
              >
                #{tag}
              </span>
            ))}
            {meal.tags.length > 3 && (
              <span className="px-2 py-0.5 text-stone-400 text-xs">
                +{meal.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-gradient-to-r from-stone-50 to-amber-50/50 border-t border-stone-100">
        <span className="text-xs text-stone-500 group-hover:text-orange-500 transition-colors">
          Click for details →
        </span>
      </div>
    </div>
  );
};

