import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContexts";
import Dashboard from "./pages/Dashboard";
import TimerPage from "./pages/TimerPage";
import DailyReportPage from "./pages/DailyReportPage";
import WeeklyReportPage from "./pages/WeeklyReportPage";
import HabitsPage from "./pages/HabitsPage";
import TasksPage from "./pages/TasksPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import LeaderboardsPage from "./pages/LeaderboardsPage";
import LeaderboardDetailPage from "./pages/LeaderboardDetailPage";
import JoinLeaderboardPage from "./pages/JoinLeaderboardPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/timer" element={<TimerPage />} />
            <Route path="/daily" element={<DailyReportPage />} />
            <Route path="/weekly" element={<WeeklyReportPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/leaderboards" element={<LeaderboardsPage />} />
            <Route path="/leaderboards/:id" element={<LeaderboardDetailPage />} />
            <Route path="/join-leaderboard" element={<JoinLeaderboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
