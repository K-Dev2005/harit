import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items: NavItem[] = [
    { label: 'Home', icon: 'dashboard', path: '/dashboard' },
    { label: 'Actions', icon: 'analytics', path: '/actions' },
    { label: 'Leaderboard', icon: 'group', path: '/leaderboard' },
    { label: 'Badges', icon: 'person', path: '/badges' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-surface-variant flex justify-around py-sm z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
      {items.map((item) => {
        const isActive = location.pathname.startsWith(item.path) || 
                         (item.path === '/actions' && location.pathname.startsWith('/review')) ||
                         (item.path === '/dashboard' && location.pathname === '/');
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-xs py-1 px-4 rounded-full transition-all duration-200"
          >
            <span
              className={`material-symbols-outlined text-[24px] transition-colors ${
                isActive ? 'text-primary fill-icon' : 'text-on-surface-variant'
              }`}
            >
              {item.icon}
            </span>
            <span
              className={`text-[11px] font-medium tracking-tight transition-colors ${
                isActive ? 'text-primary font-semibold' : 'text-on-surface-variant'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
