import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getDailyLog, getTodayDateString } from "../utils/storage";
import { calculateDailySummary } from "../utils/calculations";

const navItems = [
  { to: "/meals", label: "Meals" },
  { to: "/plan", label: "Plan Day" },
  { to: "/chat", label: "💬 Chat" },
  { to: "/cheat", label: "Cheat Meals" },
  { to: "/history", label: "History" },
];

export const Layout = () => {
  const [todayCredits, setTodayCredits] = useState<number | null>(null);
  const location = useLocation();

  useEffect(() => {
    const updateCredits = () => {
      const today = getTodayDateString();
      const todayLog = getDailyLog(today);
      if (todayLog) {
        const summary = calculateDailySummary(todayLog);
        setTodayCredits(summary.netCredits);
      } else {
        setTodayCredits(null);
      }
    };

    updateCredits();
    
    // Update when route changes (in case user navigates after logging meals)
    // Update every minute to keep it fresh
    const interval = setInterval(updateCredits, 60000);
    
    // Listen for storage changes (when user logs meals or purchases cheat meals)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "mealCreditsLogs") {
        updateCredits();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    const handleCustomStorage = () => updateCredits();
    window.addEventListener("mealCreditsUpdated", handleCustomStorage);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("mealCreditsUpdated", handleCustomStorage);
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-amber-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
                <span className="text-white text-xl">🍽️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Meal Credits Planner
                </h1>
                <p className="text-xs text-stone-500">Vegetarian Family Meals</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Credits Display */}
              {todayCredits !== null && (
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl border border-amber-200">
                  <span className="text-amber-600 font-bold text-lg">★</span>
                  <div>
                    <p className="text-xs text-amber-600 font-medium">Today's Credits</p>
                    <p
                      className={`text-lg font-bold ${
                        todayCredits >= 7
                          ? "text-green-600"
                          : todayCredits >= 5
                          ? "text-amber-600"
                          : "text-red-500"
                      }`}
                    >
                      {todayCredits}
                    </p>
                  </div>
                </div>
              )}

              <nav className="flex gap-1 bg-stone-100 p-1 rounded-xl">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-white text-orange-600 shadow-sm"
                          : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-amber-200/50 bg-white/50 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-stone-500">
          Track your meals, earn credits, stay healthy
        </div>
      </footer>
    </div>
  );
};

