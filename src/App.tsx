import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import DashboardPage from './pages/dashboard/DashboardPage';
import CategoryPage from './pages/category/CategoryPage';
import ActionsPage from './pages/actions/ActionsPage';
import ReviewPage from './pages/review/ReviewPage';
import LeaderboardPage from './pages/leaderboard/LeaderboardPage';
import BadgesPage from './pages/badges/BadgesPage';
import BottomNav from './components/BottomNav';
import QuizPage from './pages/onboarding/QuizPage';
import ResultPage from './pages/onboarding/ResultPage';
import SignInPage from './pages/onboarding/SignInPage';
import ConnectAppPage from './pages/onboarding/ConnectAppPage';
import { AddEntryProvider } from './context/AddEntryContext';
import { AddEntrySheet } from './components/AddEntrySheet';
import ConnectAppsPage from './pages/apps/ConnectAppsPage';

// Responsive Layout Wrapper
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

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
          <h1 className="text-[24px] font-extrabold text-primary tracking-tight leading-none">Harit</h1>
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

          <Link
            to="/apps"
            className={`flex items-center gap-md px-md py-sm rounded-full transition-colors ${
              isActive('/apps')
                ? 'bg-primary-container text-white font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">power</span>
            <span className="text-xs font-semibold">Connect Apps</span>
          </Link>
        </div>

        <div className="mt-auto pt-sm border-t border-surface-variant/40">
          <div className="flex items-center gap-sm p-xs">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO29FJVgyJsthUMV68gyf_NQLcz1HH2iCNJMCVFy16ZVh9IAa55QOKZKzxkcB2hzZgT5oeuQZizFj1GntJau3LthYxhF4X89hiHDrpoFP6L1_Pnp0ZuNOnBiv7Tzz3x0bRI9G-EUS0LPCbcNP3UvYDqIYt9TN9xwVNPNhHQtdn16nUjgKX7G-5RMIAUOjT8lMpzGAwqSpW9LFGnsWHqyARQsZpVsCz9DBKUmc-FgE4Otp0USdXmZqtf22rm24shPdSNmyZQlwbLfYn"
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-primary">Kishlay</span>
              <span className="text-[10px] text-on-surface-variant">user_001</span>
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
      </Router>
    </AddEntryProvider>
  );
};

export default App;
