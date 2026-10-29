// ====================================================================
// LearnMate AI - 404 Not Found Page
// ====================================================================
import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-card text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-2">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
        <h2 className="text-lg font-bold text-slate-800">Page Not Found</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The educational resource or page you requested could not be located.
        </p>

        <div className="pt-2 flex justify-center gap-3">
          <Link to="/dashboard">
            <Button size="sm" leftIcon={<Home className="w-4 h-4" />}>
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Landing Page
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
