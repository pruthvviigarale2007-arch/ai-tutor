// ====================================================================
// LearnMate AI - Sign In Page
// ====================================================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, UserCheck, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export const LoginPage: React.FC = () => {
  const { login, loginDemo, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password reset modal state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginDemo('demo-student-alex');
      navigate('/dashboard');
    } catch (err: any) {
      setError('Could not initialize demo session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError('Password reset failed. Please check the email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            LearnMate <span className="text-brand-600">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
        <p className="mt-1 text-xs text-slate-500">Sign in to resume your personalized learning roadmap</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-card border border-slate-200/80 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetOpen(true)}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Sign In
            </Button>
          </form>

          {/* Quick Demo Student Option */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">or test immediately</span>
              </div>
            </div>

            <div className="mt-4">
              <Button
                type="button"
                variant="secondary"
                className="w-full text-xs font-semibold"
                leftIcon={<UserCheck className="w-4 h-4" />}
                onClick={handleDemoLogin}
                isLoading={isLoading}
              >
                Sign In as Demo Student (Alex Johnson)
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => {
          setIsResetOpen(false);
          setResetSent(false);
        }}
        title="Reset your password"
        description="Enter your registered email address and we'll send a recovery link."
      >
        {resetSent ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">Password recovery email sent!</p>
            <p className="text-xs text-slate-500">Please check your inbox and follow the instructions.</p>
            <Button className="mt-2" onClick={() => setIsResetOpen(false)}>
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="alex@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsResetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={resetLoading}>
                Send Recovery Link
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
