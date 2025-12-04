import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { MealsPage } from "./pages/MealsPage";
import { PlanDayPage } from "./pages/PlanDayPage";
import { CheatMealsPage } from "./pages/CheatMealsPage";
import { HistoryPage } from "./pages/HistoryPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/meals" replace />} />
          <Route path="meals" element={<MealsPage />} />
          <Route path="plan" element={<PlanDayPage />} />
          <Route path="cheat" element={<CheatMealsPage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
