import { HashRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ExamSetup from "./pages/ExamSetup";
import ExamRunner from "./pages/ExamRunner";
import ResultSummary from "./pages/ResultSummary";
import ResultReview from "./pages/ResultReview";
import Weaknesses from "./pages/Weaknesses";
import Statistics from "./pages/Statistics";
import QuestionsPage from "./pages/QuestionsPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/exam/new" element={<ExamSetup />} />
          <Route path="/exam/run" element={<ExamRunner />} />
          <Route path="/results/:resultId" element={<ResultSummary />} />
          <Route path="/results/:resultId/review" element={<ResultReview />} />
          <Route path="/weaknesses" element={<Weaknesses />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
