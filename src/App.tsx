import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import SupabaseSetup from "./pages/SupabaseSetup";
import { AuthProvider } from "./lib/AuthContext.jsx";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AuthCallback from "@/pages/AuthCallback";
import { SidebarProvider } from "@/components/ui/sidebar";
import LoadingFallback from "@/components/ui/loading-fallback";
import { ThemeProvider } from "./lib/theme-provider";
import { useLocalStorageFallback, checkConnectivity } from "./lib/supabase";
import { useEffect, useState, Suspense, lazy } from "react";
import { initializeDatabase } from "./lib/database";
import { NotificationsProvider } from "@/lib/NotificationContext";
import OnlineProvider from '@/contexts/OnlineContext';
import AccessibilityProvider from '@/contexts/AccessibilityContext';
import { AccessibilitySettingsButton } from '@/components/accessibility/AccessibilitySettings';

// Lazy load pages for better initial load performance
const DashboardPage = lazy(() => import('@/pages/Dashboard'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const Settings = lazy(() => import('@/pages/Settings'));
const Assessments = lazy(() => import('@/pages/Assessments'));
const Labs = lazy(() => import('@/pages/Labs'));
const LabDetail = lazy(() => import('@/pages/LabDetail'));
const MyLibrary = lazy(() => import('@/pages/MyLibrary'));
const CurriculumPlanner = lazy(() => import('@/pages/CurriculumPlanner'));
const DifferentiationHelper = lazy(() => import('@/pages/DifferentiationHelper'));
const RubricGenerator = lazy(() => import('@/pages/RubricGenerator'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Collaboration = lazy(() => import('@/pages/Collaboration'));
const Accessibility = lazy(() => import('@/pages/Accessibility'));
const Landing = lazy(() => import('@/pages/Landing'));
const CollaborativeWorkspace = lazy(() => import('@/pages/CollaborativeWorkspace'));
const IntegrationsHub = lazy(() => import('@/pages/IntegrationsHub'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Lessons = lazy(() => import('@/pages/Lessons'));
const MobileDownload = lazy(() => import('@/pages/MobileDownload'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const TeacherTraining = lazy(() => import("./pages/TeacherTraining"));
const SupabaseTest = lazy(() => import('./components/SupabaseTest'));

// Create a wrapper component for LazyCollaboration that provides SidebarProvider
const CollaborationWithSidebar = () => (
  <SidebarProvider>
    <Collaboration />
  </SidebarProvider>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnMount: true,
    },
  },
});

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
  <div className="using-fallback-notice bg-yellow-500/80 dark:bg-yellow-600/80 text-black dark:text-white px-4 py-2 text-sm fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center">
    <div className="max-w-4xl flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>
        Using <strong>localStorage</strong> fallback for data persistence. Data will not be synced across devices or browsers.
        Add Supabase credentials in <code className="bg-black/10 dark:bg-white/10 px-1 rounded">.env</code> file to enable cloud storage.
      </span>
    </div>
  </div>
);

const App = () => {
  const usingFallback = useLocalStorageFallback();
  const [showFallback, setShowFallback] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Check connectivity to Supabase
  useEffect(() => {
    const checkConnection = async () => {
      if (!usingFallback) {
        try {
          const connected = await checkConnectivity();
          setIsConnected(connected);
          if (!connected) {
            console.warn('No connectivity to Supabase detected, some features may not work properly');
          } else {
            // Initialize database tables if connected
            const initialized = await initializeDatabase();
            setDbInitialized(initialized);
            console.log('Database initialization status:', initialized);
          }
        } catch (error) {
          console.error('Error checking connectivity:', error);
          setIsConnected(false);
        }
      }
    };
    
    checkConnection();
  }, [usingFallback]);

  // Show fallback notice after a delay
  useEffect(() => {
    if (usingFallback) {
      const timer = setTimeout(() => {
        setShowFallback(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [usingFallback]);

  // Error handler for unhandled errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Unhandled error:', event.error);
      // Log to console, could also send to a logging service
    };

    window.addEventListener('error', handleGlobalError);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  // Defer non-critical initialization
  useEffect(() => {
    // Give the browser a chance to paint before initializing the app
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  // Show a minimal loading state until ready
  if (!isReady) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="edgenie-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <OnlineProvider>
              <AccessibilityProvider>
                <NotificationsProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <ColorBlindnessFilters />
                    {showFallback && <FallbackNotice />}
                    <div className="min-h-screen flex flex-col bg-background antialiased scrollbar-none smooth-scroll">
                      <BrowserRouter>
                        <Routes>
                          <Route path="/" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Landing />
                            </Suspense>
                          } />
                          <Route path="/auth/callback" element={<AuthCallback />} />
                          <Route path="/login" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Login />
                            </Suspense>
                          } />
                          <Route path="/signup" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Signup />
                            </Suspense>
                          } />
                          <Route path="/download" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <MobileDownload />
                            </Suspense>
                          } />
                          <Route path="/supabase-test" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <SupabaseTest />
                            </Suspense>
                          } />
                          <Route path="/dashboard" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <DashboardPage />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/lessons" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <Lessons />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/lessons/:lessonId" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <Lessons />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/assessments" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <Assessments />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/assessments/:id" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <Assessments />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/labs" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <Labs />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/labs/:id" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <LabDetail />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/settings" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <Settings />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/my-library" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <MyLibrary />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/curriculum-planner" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <CurriculumPlanner />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/differentiation" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <DifferentiationHelper />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/rubric-generator" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <RubricGenerator />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/analytics" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <Analytics />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/collaboration" element={
                            <AuthGuard>
                              <ErrorBoundary>
                                <Suspense fallback={<LoadingFallback />}>
                                  <CollaborationWithSidebar />
                                </Suspense>
                              </ErrorBoundary>
                            </AuthGuard>
                          } />
                          <Route path="/accessibility" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <Accessibility />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/collaborative-workspace" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <CollaborativeWorkspace />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/integrations" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <IntegrationsHub />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route path="/supabase-setup" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <SupabaseSetup />
                            </Suspense>
                          } />
                          <Route path="/notifications" element={
                            <AuthGuard>
                              <Suspense fallback={<LoadingFallback />}>
                                <Notifications />
                              </Suspense>
                            </AuthGuard>
                          } />
                          <Route 
                            path="/training" 
                            element={
                              <AuthGuard>
                                <Suspense fallback={<LoadingFallback />}>
                                  <TeacherTraining />
                                </Suspense>
                              </AuthGuard>
                            } 
                          />
                          <Route path="*" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <NotFound />
                            </Suspense>
                          } />
                        </Routes>
                        <AccessibilitySettingsButton />
                      </BrowserRouter>
                    </div>
                  </TooltipProvider>
                </NotificationsProvider>
              </AccessibilityProvider>
            </OnlineProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;



