import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, loginDemo } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
              LearnMate <span className="text-brand-600">AI</span>
            </span>
            <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase -mt-1">
              Adaptive Tutor
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#how-it-works" className="hover:text-brand-600 transition-colors">
            How It Works
          </a>
          <a href="#features" className="hover:text-brand-600 transition-colors">
            Features
          </a>
          <a href="#tutor-modes" className="hover:text-brand-600 transition-colors">
            Tutor Modes
          </a>
          <a href="#faq" className="hover:text-brand-600 transition-colors">
            FAQ
          </a>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard">
              <Button size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <button
                onClick={() => loginDemo()}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/80 px-3 py-1.5 rounded-lg border border-brand-200/60 transition-colors"
                title="Instant login with pre-configured student profile"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Demo Student
              </button>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Start Free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
