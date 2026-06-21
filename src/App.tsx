import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import { AddEntryProvider } from './context/AddEntryContext';
import { AddEntrySheet } from './components/AddEntrySheet';
import { getAuthName, getAuthUserId } from './lib/auth';

// Lazy-loaded pages — each gets its own JS chunk, loaded only when navigated to.
// This reduces the initial bundle from ~374KB to ~80-120KB.
const DashboardPage    = React.lazy(() => import('./pages/dashboard/DashboardPage'));
const CategoryPage     = React.lazy(() => import('./pages/category/CategoryPage'));
const ActionsPage      = React.lazy(() => import('./pages/actions/ActionsPage'));
const ReviewPage       = React.lazy(() => import('./pages/review/ReviewPage'));
const LeaderboardPage  = React.lazy(() => import('./pages/leaderboard/LeaderboardPage'));
const BadgesPage       = React.lazy(() => import('./pages/badges/BadgesPage'));
const QuizPage         = React.lazy(() => import('./pages/onboarding/QuizPage'));
const ResultPage       = React.lazy(() => import('./pages/onboarding/ResultPage'));
const SignInPage       = React.lazy(() => import('./pages/onboarding/SignInPage'));
const ConnectAppPage   = React.lazy(() => import('./pages/onboarding/ConnectAppPage'));
const ConnectAppsPage  = React.lazy(() => import('./pages/apps/ConnectAppsPage'));

/** Lightweight fallback shown while a lazy chunk is loading */
const PageLoader: React.FC = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// Responsive Layout Wrapper
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [userName, setUserName] = useState(getAuthName());
  const [userId, setUserId]     = useState(getAuthUserId());

  // Keep sidebar in sync if auth changes (e.g. after OAuth redirect)
  useEffect(() => {
    setUserName(getAuthName());
    setUserId(getAuthUserId());
  }, [location.pathname]);

  // Initials avatar — no broken image if user has no Google photo
  const initials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Highlight active link in sidebar
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    if (path === '/actions') {
      return location.pathname.startsWith('/actions') || location.pathname.startsWith('/review');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      {/* SideNavBar (Desktop only, hidden on mobile) */}
      <nav className="hidden md:flex flex-col h-full py-lg px-md w-64 border-r bg-surface border-surface-variant/80 z-20">
        <div className="mb-xxl">
          <h1 className="text-[24px] font-extrabold text-primary tracking-tight leading-none">CtrlC</h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Carbon Ledger</p>
        </div>
        
        <div className="flex-1 space-y-xs">
          <Link
            to="/dashboard"
            className={`flex items-center gap-md px-md py-sm rounded-full transition-colors ${
              isActive('/dashboard')
                ? 'bg-primary-container text-white font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span className="text-xs font-semibold">Dashboard</span>
          </Link>

          <Link
            to="/actions"
            className={`flex items-center gap-md px-md py-sm rounded-full transition-colors ${
              isActive('/actions')
                ? 'bg-primary-container text-white font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">analytics</span>
            <span className="text-xs font-semibold">Actions</span>
          </Link>

          <Link
            to="/leaderboard"
            className={`flex items-center gap-md px-md py-sm rounded-full transition-colors ${
              isActive('/leaderboard')
                ? 'bg-primary-container text-white font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span className="text-xs font-semibold">Leaderboard</span>
          </Link>

          <Link
            to="/badges"
            className={`flex items-center gap-md px-md py-sm rounded-full transition-colors ${
              isActive('/badges')
                ? 'bg-primary-container text-white font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">emoji_events</span>
            <span className="text-xs font-semibold">Badges</span>
          </Link>


        </div>

        <div className="mt-auto pt-sm border-t border-surface-variant/40">
          <div className="flex items-center gap-sm p-xs">
            {/* Initials avatar — no broken external image dependency */}
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center border border-outline-variant">
              <span className="text-[13px] font-bold text-white">{initials}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-primary">{userName}</span>
              <span className="text-[10px] text-on-surface-variant">{userId}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-grow h-full overflow-y-auto">
        {children}
      </div>

      {/* Bottom Nav Bar (Mobile only, hidden on desktop) */}
      <BottomNav />
      <AddEntrySheet />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AddEntryProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Onboarding Routes (No AppLayout) */}
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/connect-app" element={<ConnectAppPage />} />

            {/* Main App Routes */}
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              }
            />
            <Route
              path="/category/:slug"
              element={
                <AppLayout>
                  <CategoryPage />
                </AppLayout>
              }
            />
            <Route
              path="/actions"
              element={
                <AppLayout>
                  <ActionsPage />
                </AppLayout>
              }
            />
            <Route
              path="/review"
              element={
                <AppLayout>
                  <ReviewPage />
                </AppLayout>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <AppLayout>
                  <LeaderboardPage />
                </AppLayout>
              }
            />
            <Route
              path="/badges"
              element={
                <AppLayout>
                  <BadgesPage />
                </AppLayout>
              }
            />
            <Route
              path="/apps"
              element={
                <AppLayout>
                  <ConnectAppsPage />
                </AppLayout>
              }
            />
            {/* Fallbacks */}
            <Route path="/" element={<Navigate to="/quiz" replace />} />
            <Route path="*" element={<Navigate to="/quiz" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AddEntryProvider>
  );
};

export default App;
