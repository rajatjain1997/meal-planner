import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getMealByIdFromLibrary } from "../utils/chatMeals";
import type { DailyLog, Meal, MealPlanOption } from "../types";
import { getDailyLog, getTodayDateString } from "../utils/storage";
import { calculateDailySummary } from "../utils/calculations";
import { formatMealTime } from "../utils/time";
import {
  generateMealPlanOptions,
  getMealPlan,
  saveMealPlan,
  getNextDayDateString,
} from "../utils/plans";
import { MealDetailModal } from "../components/MealDetailModal";

export const PlanDayPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateFromUrl = searchParams.get("date");
  const [selectedDate, setSelectedDate] = useState(
    dateFromUrl || getTodayDateString()
  );
  const [planOptions, setPlanOptions] = useState<MealPlanOption[]>([]);
  const [selectedPlanOption, setSelectedPlanOption] = useState<number | null>(
    null
  );
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [extraCredits, setExtraCredits] = useState<number>(0);
  const [cheatCreditsUsed, setCheatCreditsUsed] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  const today = getTodayDateString();
  const tomorrow = getNextDayDateString();
  const isToday = selectedDate === today;
  const isTomorrow = selectedDate === tomorrow;


  const [refreshKey, setRefreshKey] = useState(0);

  // Load existing plan and log
  const existingPlan = useMemo(
    () => getMealPlan(selectedDate),
    [selectedDate, refreshKey]
  );
  const existingLog = useMemo(
    () => getDailyLog(selectedDate),
    [selectedDate, refreshKey]
  );

  // Listen for meal credits updates
  useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener("mealCreditsUpdated", handleUpdate);
    return () => window.removeEventListener("mealCreditsUpdated", handleUpdate);
  }, []);

  // Generate plan options for tomorrow if no plan exists
  useEffect(() => {
    if (isTomorrow && !existingPlan && planOptions.length === 0) {
      setPlanOptions(generateMealPlanOptions());
    }
  }, [isTomorrow, existingPlan, planOptions.length]);

  // Update URL when date changes
  useEffect(() => {
    if (selectedDate !== dateFromUrl) {
      setSearchParams({ date: selectedDate });
    }
  }, [selectedDate, dateFromUrl, setSearchParams]);

  // Load existing data when date changes
  useEffect(() => {
    if (existingLog) {
      setExtraCredits(existingLog.extraCredits || 0);
      setCheatCreditsUsed(existingLog.cheatCreditsUsed || 0);
      setNotes(existingLog.notes || "");
    } else {
      setExtraCredits(0);
      setCheatCreditsUsed(0);
      setNotes("");
    }
  }, [existingLog]);

  // Calculate summary for display
  const getDisplaySummary = () => {
    // If there's a cooked log, use that
    if (existingLog) {
      return calculateDailySummary(existingLog);
    }
    // Otherwise use the plan
    if (existingPlan) {
      const planLog: DailyLog = {
        date: selectedDate,
        breakfastId: existingPlan.breakfastId,
        lunchId: existingPlan.lunchId,
        dinnerId: existingPlan.dinnerId,
        extraCredits: extraCredits || undefined,
        cheatCreditsUsed: cheatCreditsUsed || undefined,
      };
      return calculateDailySummary(planLog);
    }
    return null;
  };

  const summary = getDisplaySummary();

  const handleCommitPlan = () => {
    if (selectedPlanOption === null) return;

    const option = planOptions[selectedPlanOption];
    const plan = {
      date: selectedDate,
      breakfastId: option.breakfastId,
      lunchId: option.lunchId,
      dinnerId: option.dinnerId,
      committedAt: new Date().toISOString(),
    };

    saveMealPlan(plan);
    setPlanOptions([]);
    setSelectedPlanOption(null);
  };

  const handleRegenerateOptions = () => {
    setPlanOptions(generateMealPlanOptions());
    setSelectedPlanOption(null);
  };

  const PlanMealCard = ({
    mealId,
    type,
    isPlanned,
    isCooked,
  }: {
    mealId: string;
    type: "breakfast" | "lunch" | "dinner";
    isPlanned: boolean;
    isCooked: boolean;
  }) => {
    const meal = getMealByIdFromLibrary(mealId);
    if (!meal) return null;

    const icons = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" };
    const mealTime =
      type === "breakfast"
        ? existingLog?.breakfastTime
        : type === "lunch"
        ? existingLog?.lunchTime
        : existingLog?.dinnerTime;

    return (
      <div
        className={`p-4 rounded-xl border-2 ${
          isCooked
            ? "bg-green-50 border-green-200"
            : isPlanned
            ? "bg-amber-50 border-amber-200"
            : "bg-stone-50 border-stone-200"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{icons[type]}</span>
              <span className="text-xs font-medium uppercase text-stone-500">
                {type}
              </span>
              {isCooked && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Cooked
                </span>
              )}
              {isPlanned && !isCooked && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  Planned
                </span>
              )}
            </div>
            <h3 className="font-semibold text-stone-800 mb-1">{meal.name}</h3>
            <div className="flex items-center gap-3 text-sm text-stone-600">
              <span>{meal.credits}★</span>
              <span>•</span>
              <span>{meal.calories} cal</span>
              <span>•</span>
              <span className="capitalize">{meal.difficulty}</span>
            </div>
            {mealTime && (
              <p className="text-xs text-stone-400 mt-1">
                Cooked at {formatMealTime(mealTime)}
              </p>
            )}
          </div>
          <button
            onClick={() => setSelectedMeal(meal)}
            className="px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
          >
            View
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-stone-800">Plan Your Day</h2>
            <p className="text-stone-500 text-sm">
              {isToday
                ? "View today's plan or cook meals"
                : isTomorrow
                ? "Plan tomorrow's meals"
                : "View plan for selected date"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDate(today)}
              className="px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(tomorrow)}
              className="px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              Tomorrow
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 rounded-xl border border-stone-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Today's Plan Display */}
      {isToday && existingPlan && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Today's Plan</h3>
              <p className="text-amber-100 text-sm">
                Cook these meals or choose something else
              </p>
            </div>
            {existingPlan.committedAt && (
              <span className="text-xs text-amber-100">
                Committed{" "}
                {new Date(existingPlan.committedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tomorrow's Planning Options */}
      {isTomorrow && !existingPlan && planOptions.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-stone-800">
                Choose Tomorrow's Plan
              </h3>
              <p className="text-stone-500 text-sm">
                Select one of these 3 meal combinations
              </p>
            </div>
            <button
              onClick={handleRegenerateOptions}
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              🔄 New Options
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {planOptions.map((option, idx) => {
              const breakfast = getMealByIdFromLibrary(option.breakfastId);
              const lunch = getMealByIdFromLibrary(option.lunchId);
              const dinner = getMealByIdFromLibrary(option.dinnerId);
              const totalCredits =
                (breakfast?.credits || 0) +
                (lunch?.credits || 0) +
                (dinner?.credits || 0);
              const totalCalories =
                (breakfast?.calories || 0) +
                (lunch?.calories || 0) +
                (dinner?.calories || 0);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedPlanOption(idx)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPlanOption === idx
                      ? "border-orange-500 bg-orange-50 shadow-md"
                      : "border-stone-200 hover:border-orange-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-stone-600">
                      Option {idx + 1}
                    </span>
                    {selectedPlanOption === idx && (
                      <span className="px-2 py-0.5 bg-orange-500 text-white rounded-full text-xs font-medium">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="text-sm">
                      <span className="text-stone-400">🌅</span>{" "}
                      <span className="text-stone-700">{breakfast?.name}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-stone-400">☀️</span>{" "}
                      <span className="text-stone-700">{lunch?.name}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-stone-400">🌙</span>{" "}
                      <span className="text-stone-700">{dinner?.name}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
                    <span className="text-stone-600">
                      {totalCredits}★ • {totalCalories} cal
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCommitPlan}
            disabled={selectedPlanOption === null}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              selectedPlanOption !== null
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-orange-200"
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            }`}
          >
            {selectedPlanOption !== null
              ? "✓ Commit to This Plan"
              : "Select an option to commit"}
          </button>
        </div>
      )}

      {/* Show existing plan or cooked meals */}
      {(existingPlan || existingLog) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Meal Display */}
          <div className="lg:col-span-2 space-y-4">
            {existingPlan && (
              <>
                <PlanMealCard
                  mealId={existingPlan.breakfastId}
                  type="breakfast"
                  isPlanned={true}
                  isCooked={!!existingLog?.breakfastId}
                />
                <PlanMealCard
                  mealId={existingPlan.lunchId}
                  type="lunch"
                  isPlanned={true}
                  isCooked={!!existingLog?.lunchId}
                />
                <PlanMealCard
                  mealId={existingPlan.dinnerId}
                  type="dinner"
                  isPlanned={true}
                  isCooked={!!existingLog?.dinnerId}
                />
              </>
            )}

            {/* Show cooked meals that aren't in plan */}
            {existingLog &&
              !existingPlan &&
              (existingLog.breakfastId ||
                existingLog.lunchId ||
                existingLog.dinnerId) && (
                <>
                  {existingLog.breakfastId && (
                    <PlanMealCard
                      mealId={existingLog.breakfastId}
                      type="breakfast"
                      isPlanned={false}
                      isCooked={true}
                    />
                  )}
                  {existingLog.lunchId && (
                    <PlanMealCard
                      mealId={existingLog.lunchId}
                      type="lunch"
                      isPlanned={false}
                      isCooked={true}
                    />
                  )}
                  {existingLog.dinnerId && (
                    <PlanMealCard
                      mealId={existingLog.dinnerId}
                      type="dinner"
                      isPlanned={false}
                      isCooked={true}
                    />
                  )}
                </>
              )}

            {/* Extra Options */}
            {(existingPlan || existingLog) && (
              <div className="bg-white rounded-2xl border border-stone-200 p-5">
                <h3 className="font-semibold text-stone-800 mb-4">
                  Additional Options
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-2">
                      Extra Credits (e.g., set bonus)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={extraCredits}
                      onChange={(e) =>
                        setExtraCredits(Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-2">
                      Cheat Credits Used
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={cheatCreditsUsed}
                      onChange={(e) =>
                        setCheatCreditsUsed(
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-stone-600 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any notes for the day..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Summary Card */}
          {summary && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden sticky top-24">
                <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <h3 className="font-semibold text-lg">Daily Summary</h3>
                  <p className="text-amber-100 text-sm">
                    {new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  {/* Credits Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Meal Credits</span>
                      <span className="font-medium text-stone-700">
                        {summary.mealCredits}
                      </span>
                    </div>
                    {summary.extraCredits > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">Extra Credits</span>
                        <span className="font-medium text-green-600">
                          +{summary.extraCredits}
                        </span>
                      </div>
                    )}
                    {summary.cheatCreditsUsed > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">Cheat Credits</span>
                        <span className="font-medium text-red-500">
                          -{summary.cheatCreditsUsed}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-stone-100 flex justify-between">
                      <span className="font-semibold text-stone-800">
                        Net Credits
                      </span>
                      <span
                        className={`text-2xl font-bold ${
                          summary.netCredits >= 7
                            ? "text-green-600"
                            : summary.netCredits >= 5
                            ? "text-amber-600"
                            : "text-red-500"
                        }`}
                      >
                        {summary.netCredits}
                      </span>
                    </div>
                  </div>

                  {/* Calories */}
                  <div className="pt-4 border-t border-stone-100">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-600">Total Calories</span>
                      <span className="text-xl font-bold text-stone-800">
                        {summary.totalCalories}
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (summary.totalCalories / 2000) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      {Math.round((summary.totalCalories / 2000) * 100)}% of
                      2000 cal daily goal
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No plan or log message */}
      {!existingPlan && !existingLog && !isTomorrow && (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-stone-700 mb-2">
            No plan for this date
          </h3>
          <p className="text-stone-500 mb-6">
            Go to tomorrow to create a meal plan
          </p>
          <button
            onClick={() => setSelectedDate(tomorrow)}
            className="inline-flex px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all"
          >
            Plan Tomorrow
          </button>
        </div>
      )}

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <MealDetailModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onMealLogged={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
};
