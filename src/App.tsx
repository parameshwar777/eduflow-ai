import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LoginPage } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { MarkAttendance } from "@/pages/MarkAttendance";
import { StudentTraining } from "@/pages/StudentTraining";
import { Analytics } from "@/pages/Analytics";
import { Alerts } from "@/pages/Alerts";
import { AdminPanel } from "@/pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
            <Route path="/attendance/mark" element={<DashboardLayout><MarkAttendance /></DashboardLayout>} />
            <Route path="/training" element={<DashboardLayout><StudentTraining /></DashboardLayout>} />
            <Route path="/analytics" element={<DashboardLayout><Analytics /></DashboardLayout>} />
            <Route path="/alerts" element={<DashboardLayout><Alerts /></DashboardLayout>} />
            <Route path="/admin/*" element={<DashboardLayout><AdminPanel /></DashboardLayout>} />
            <Route path="/subjects" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
