import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Lessons from "./pages/Lessons";
import Assessments from "./pages/Assessments";
import Labs from "./pages/Labs";
import LabDetail from "./pages/LabDetail";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import MyLibrary from "./pages/MyLibrary";
import CurriculumPlanner from "./pages/CurriculumPlanner";
import DifferentiationHelper from "./pages/DifferentiationHelper";
import RubricGenerator from "./pages/RubricGenerator";
import Analytics from "./pages/Analytics";
import Collaboration from "./pages/Collaboration";
import Accessibility from "./pages/Accessibility";
import Templates from "./pages/Templates";
import { ThemeProvider } from "./lib/theme-provider";
import { useLocalStorageFallback } from "./lib/supabase";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

// SVG filters for color blindness simulation
const ColorBlindnessFilters = () => (
  <svg className="accessibility-filters">
    <defs>
      <filter id="protanopia-filter">
        <feColorMatrix
          type="matrix"
          values="0.567, 0.433, 0, 0, 0
                  0.558, 0.442, 0, 0, 0
                  0, 0.242, 0.758, 0, 0
                  0, 0, 0, 1, 0"
        />
      </filter>
      <filter id="deuteranopia-filter">
        <feColorMatrix
          type="matrix"
          values="0.625, 0.375, 0, 0, 0
                  0.7, 0.3, 0, 0, 0
                  0, 0.3, 0.7, 0, 0
                  0, 0, 0, 1, 0"
        />
      </filter>
      <filter id="tritanopia-filter">
        <feColorMatrix
          type="matrix"
          values="0.95, 0.05, 0, 0, 0
                  0, 0.433, 0.567, 0, 0
                  0, 0.475, 0.525, 0, 0
                  0, 0, 0, 1, 0"
        />
      </filter>
    </defs>
  </svg>
);

// Fallback notice component
const FallbackNotice = () => (
  <div className="using-fallback-notice">
    Using localStorage fallback. Add Supabase credentials in .env to enable cloud storage.
  </div>
);

const App = () => {
  const usingFallback = useLocalStorageFallback();
  const [showFallback, setShowFallback] = useState(false);

  // Show fallback notice after a delay
  useEffect(() => {
    if (usingFallback) {
      const timer = setTimeout(() => {
        setShowFallback(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [usingFallback]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="edgenie-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ColorBlindnessFilters />
          {showFallback && <FallbackNotice />}
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/lessons" element={<Lessons />} />
              <Route path="/assessments" element={<Assessments />} />
              <Route path="/labs" element={<Labs />} />
              <Route path="/labs/:id" element={<LabDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/my-library" element={<MyLibrary />} />
              <Route path="/curriculum-planner" element={<CurriculumPlanner />} />
              <Route path="/differentiation" element={<DifferentiationHelper />} />
              <Route path="/rubric-generator" element={<RubricGenerator />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/collaboration" element={<Collaboration />} />
              <Route path="/accessibility" element={<Accessibility />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
