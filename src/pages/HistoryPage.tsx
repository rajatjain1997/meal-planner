import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAllDailyLogs, formatDate, deleteDailyLog } from "../utils/storage";
import { calculateDailySummary } from "../utils/calculations";
import { formatMealTime } from "../utils/time";
import type { DailyLog } from "../types";

export const HistoryPage = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    setLogs(getAllDailyLogs());
  }, []);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const comparison = a.date.localeCompare(b.date);
      return sortOrder === "desc" ? -comparison : comparison;
    });
  }, [logs, sortOrder]);

  const handleDelete = (date: string) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      deleteDailyLog(date);
      setLogs(getAllDailyLogs());
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        const summary = calculateDailySummary(log);
        return {
          totalCredits: acc.totalCredits + summary.totalCredits,
          totalCheat: acc.totalCheat + summary.cheatCreditsUsed,
          totalNet: acc.totalNet + summary.netCredits,
          totalCalories: acc.totalCalories + summary.totalCalories,
        };
      },
      { totalCredits: 0, totalCheat: 0, totalNet: 0, totalCalories: 0 }
    );
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-stone-700 mb-2">
          No history yet
        </h3>
        <p className="text-stone-500 mb-6">
          Start planning your meals to see your history here
        </p>
        <Link
          to="/plan"
          className="inline-flex px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all"
        >
          Plan Your Day
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-stone-800">Meal History</h2>
            <p className="text-stone-500 text-sm">
              Track your daily meal credits and calories
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">Sort:</span>
            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              {sortOrder === "desc" ? "Newest First ↓" : "Oldest First ↑"}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <p className="text-sm text-stone-500 mb-1">Total Days Logged</p>
          <p className="text-3xl font-bold text-stone-800">{logs.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <p className="text-sm text-stone-500 mb-1">Total Credits Earned</p>
          <p className="text-3xl font-bold text-green-600">{totals.totalCredits}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <p className="text-sm text-stone-500 mb-1">Avg Net Credits/Day</p>
          <p className="text-3xl font-bold text-amber-600">
            {logs.length > 0 ? (totals.totalNet / logs.length).toFixed(1) : 0}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <p className="text-sm text-stone-500 mb-1">Avg Calories/Day</p>
          <p className="text-3xl font-bold text-stone-800">
            {logs.length > 0
              ? Math.round(totals.totalCalories / logs.length)
              : 0}
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-stone-50 to-amber-50/30">
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-600">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-600">
                  🌅 Breakfast
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-600">
                  ☀️ Lunch
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-600">
                  🌙 Dinner
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-stone-600">
                  Credits
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-stone-600">
                  Cheat
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-stone-600">
                  Net
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-stone-600">
                  Calories
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-stone-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sortedLogs.map((log) => {
                const summary = calculateDailySummary(log);
                return (
                  <tr
                    key={log.date}
                    className="hover:bg-amber-50/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-800">
                        {formatDate(log.date)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[150px]">
                        {summary.breakfastMeal ? (
                          <>
                            <span className="text-sm text-stone-600 truncate block">
                              {summary.breakfastMeal.name}
                            </span>
                            {log.breakfastTime && (
                              <span className="text-xs text-stone-400">
                                {formatMealTime(log.breakfastTime)}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-stone-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[150px]">
                        {summary.lunchMeal ? (
                          <>
                            <span className="text-sm text-stone-600 truncate block">
                              {summary.lunchMeal.name}
                            </span>
                            {log.lunchTime && (
                              <span className="text-xs text-stone-400">
                                {formatMealTime(log.lunchTime)}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-stone-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[150px]">
                        {summary.dinnerMeal ? (
                          <>
                            <span className="text-sm text-stone-600 truncate block">
                              {summary.dinnerMeal.name}
                            </span>
                            {log.dinnerTime && (
                              <span className="text-xs text-stone-400">
                                {formatMealTime(log.dinnerTime)}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-stone-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-green-600">
                        {summary.totalCredits}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={
                          summary.cheatCreditsUsed > 0
                            ? "font-medium text-red-500"
                            : "text-stone-400"
                        }
                      >
                        {summary.cheatCreditsUsed > 0
                          ? `-${summary.cheatCreditsUsed}`
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-bold ${
                          summary.netCredits >= 7
                            ? "text-green-600"
                            : summary.netCredits >= 5
                            ? "text-amber-600"
                            : "text-red-500"
                        }`}
                      >
                        {summary.netCredits}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-stone-700">
                        {summary.totalCalories}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/plan?date=${log.date}`}
                          className="p-1.5 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(log.date)}
                          className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

