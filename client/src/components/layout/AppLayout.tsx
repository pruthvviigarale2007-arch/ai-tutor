// ====================================================================
// LearnMate AI - Main Authenticated App Layout & Sidebar Shell
// ====================================================================
import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Compass,
  FileText,
  Award,
  BarChart3,
  Calendar,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Flame,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Tutor', path: '/tutor', icon: Bot, highlight: true },
    { label: 'My Learning Paths', path: '/learning-paths', icon: Compass },
    { label: 'Study Materials', path: '/materials', icon: FileText },
    { label: 'Practice & Quizzes', path: '/quizzes', icon: Award },
    { label: 'Progress Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Study Planner', path: '/planner', icon: Calendar },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Top Brand Section */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
            <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-900 tracking-tight leading-tight">
                    LearnMate <span className="text-brand-600">AI</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                    Personal Tutor
                  </span>
                </div>
              )}
            </Link>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
                  title={item.label}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-500'}`} />
                  {(!isCollapsed || isMobileOpen) && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {(!isCollapsed || isMobileOpen) && item.highlight && (
                    <span className="ml-auto flex h-2 w-2 rounded-full bg-brand-500" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Toggle Section */}
        <div className="p-3 border-t border-slate-100">
          {/* Collapse Toggle for Desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex w-full items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 mb-2 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* User mini banner */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/60 ${
              isCollapsed && !isMobileOpen ? 'justify-center p-1.5' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs shrink-0">
              {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'S'}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {profile?.display_name || 'Student'}
                </p>
                <p className="text-[10px] text-slate-400 capitalize truncate">
                  {profile?.education_level?.replace('_', ' ') || 'Learner'}
                </p>
              </div>
            )}
            {(!isCollapsed || isMobileOpen) && (
              <button
                onClick={handleSignOut}
                className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Context / Route Hint */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 capitalize">
                {location.pathname.replace('/', '').replace(/-/g, ' ') || 'Dashboard'}
              </span>
              <span>•</span>
              <span className="text-slate-400">Personalized Learning Active</span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Learning Streak Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 text-xs font-bold shadow-2xs">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              <span>3 Day Streak</span>
            </div>

            {/* Daily Goal Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              <span>Goal: {profile?.daily_study_minutes || 30}m/day</span>
            </div>

            {/* Quick AI Tutor Action Button */}
            <Link
              to="/tutor"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI Tutor</span>
            </Link>

            {/* Profile Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-accent-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'S'}
                </div>
              </button>

              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 py-1.5 z-50 animate-fade-in"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {profile?.display_name || 'Student'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {profile?.field_of_study || 'Learner'}
                    </p>
                  </div>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Profile & Preferences
                  </Link>
                  <Link
                    to="/privacy"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    Privacy & Data Isolation
                  </Link>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
