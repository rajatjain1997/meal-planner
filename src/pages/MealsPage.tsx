import { useState, useMemo, useEffect } from "react";
import { getCompleteMealLibrary } from "../utils/chatMeals";
import type { Meal, MealType } from "../types";
import { MealCard } from "../components/MealCard";
import { MealDetailModal } from "../components/MealDetailModal";
import { getCurrentMealType, getMealTimeMessage } from "../utils/time";

type FilterType = "all" | MealType;
type FilterCredits = "all" | 1 | 2 | 3;

export const MealsPage = () => {
  const currentMealType = getCurrentMealType();
  const [typeFilter, setTypeFilter] = useState<FilterType>(currentMealType);
  const [mealLogged, setMealLogged] = useState(false);

  // Auto-select current meal type on mount
  useEffect(() => {
    setTypeFilter(currentMealType);
  }, [currentMealType]);
  const [creditsFilter, setCreditsFilter] = useState<FilterCredits>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [allMeals, setAllMeals] = useState<Meal[]>(getCompleteMealLibrary);

  // Update meals list when chat meals change
  useEffect(() => {
    const updateMeals = () => setAllMeals(getCompleteMealLibrary());
    window.addEventListener("chatMealsUpdated", updateMeals);
    return () => window.removeEventListener("chatMealsUpdated", updateMeals);
  }, []);

  const filteredMeals = useMemo(() => {
    return allMeals.filter((meal) => {
      const matchesType = typeFilter === "all" || meal.type === typeFilter;
      const matchesCredits =
        creditsFilter === "all" || meal.credits === creditsFilter;
      const matchesSearch =
        searchQuery === "" ||
        meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.cuisines.some((c) =>
          c.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        meal.tags.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesType && matchesCredits && matchesSearch;
    });
  }, [typeFilter, creditsFilter, searchQuery, allMeals]);

  const mealTypes: { value: FilterType; label: string; icon: string }[] = [
    { value: "all", label: "All", icon: "🍽️" },
    { value: "breakfast", label: "Breakfast", icon: "🌅" },
    { value: "lunch", label: "Lunch", icon: "☀️" },
    { value: "dinner", label: "Dinner", icon: "🌙" },
  ];

  const creditOptions: { value: FilterCredits; label: string }[] = [
    { value: "all", label: "All Credits" },
    { value: 3, label: "3 ★" },
    { value: 2, label: "2 ★" },
    { value: 1, label: "1 ★" },
  ];

  const handleMealLogged = () => {
    setMealLogged(true);
    setTimeout(() => setMealLogged(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Time-based suggestion banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {currentMealType === "breakfast" ? "🌅" : currentMealType === "lunch" ? "☀️" : "🌙"}
            </span>
            <div>
              <p className="font-semibold">{getMealTimeMessage()}</p>
              <p className="text-sm text-amber-100">
                Showing {currentMealType} meals below
              </p>
            </div>
          </div>
          {mealLogged && (
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Meal logged!</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search meals, cuisines, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
            {mealTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setTypeFilter(type.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  typeFilter === type.value
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <span className="mr-1">{type.icon}</span>
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            ))}
          </div>

          {/* Credits Filter */}
          <select
            value={creditsFilter}
            onChange={(e) =>
              setCreditsFilter(
                e.target.value === "all" ? "all" : (Number(e.target.value) as 1 | 2 | 3)
              )
            }
            className="px-4 py-2.5 rounded-xl border border-stone-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none bg-white cursor-pointer"
          >
            {creditOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-stone-500">
          Showing {filteredMeals.length} of {allMeals.length} meals
        </div>
      </div>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMeals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onClick={() => setSelectedMeal(meal)}
          />
        ))}
      </div>

      {filteredMeals.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-stone-700 mb-2">
            No meals found
          </h3>
          <p className="text-stone-500">
            Try adjusting your filters or search query
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedMeal && (
        <MealDetailModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onMealLogged={handleMealLogged}
        />
      )}
    </div>
  );
};

