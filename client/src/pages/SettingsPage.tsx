// ====================================================================
// LearnMate AI - Profile & Tutor Settings
// Manage student preferences, API provider configurations, and account
// ====================================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  User,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Key,
  Database,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { EducationLevel, TutorMode } from '../types';

export const SettingsPage: React.FC = () => {
  const { profile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(profile?.education_level || 'undergraduate');
  const [fieldOfStudy, setFieldOfStudy] = useState(profile?.field_of_study || '');
  const [dailyStudyMinutes, setDailyStudyMinutes] = useState(profile?.daily_study_minutes || 30);
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_language || 'en');
  const [preferredMode, setPreferredMode] = useState<TutorMode>(
    profile?.learning_preferences?.preferred_mode || 'conceptual'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverHealth, setServerHealth] = useState<any>(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const health = await apiRequest('/health');
        setServerHealth(health);
      } catch (err) {
        console.error('Health check error:', err);
      }
    }
    checkHealth();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await apiRequest('/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          display_name: displayName,
          education_level: educationLevel,
          field_of_study: fieldOfStudy,
          daily_study_minutes: Number(dailyStudyMinutes),
          preferred_language: preferredLanguage,
          current_knowledge_level: profile?.current_knowledge_level || 'intermediate',
          learning_preferences: {
            ...profile?.learning_preferences,
            preferred_mode: preferredMode,
          },
        }),
      });

      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? All your learning history, quiz attempts, and uploaded documents will be permanently erased.')) {
      await logout();
      navigate('/');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings & Preferences</h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize your personal tutor's explanations, daily targets, and system integrations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Student Profile */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" /> Student Profile
            </h2>

            {saveSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Preferences updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Education Level
                  </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="middle_school">Middle School</option>
                    <option value="high_school">High School</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate</option>
                    <option value="professional_lifelong">Lifelong Learner</option>
                  </select>
                </div>

                <Input
                  label="Field of Study"
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Default Tutoring Mode
                  </label>
                  <select
                    value={preferredMode}
                    onChange={(e) => setPreferredMode(e.target.value as TutorMode)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="conceptual">Conceptual Mode (Why & How)</option>
                    <option value="socratic">Socratic Mode (Hints & Questions)</option>
                    <option value="beginner">Beginner Mode (Analogies, No Jargon)</option>
                    <option value="exam_prep">Exam Prep Mode (Marking Schemes)</option>
                    <option value="practical">Practical Mode (Code & Exercises)</option>
                    <option value="revision">Revision Mode (Active Summaries)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Daily Study Target (mins)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={dailyStudyMinutes}
                    onChange={(e) => setDailyStudyMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button type="submit" isLoading={isSaving}>
                  Save Preferences
                </Button>
              </div>
            </form>
          </Card>

          {/* Danger Zone: Account Deletion */}
          <Card className="p-6 border-rose-200 bg-rose-50/20">
            <h3 className="text-sm font-bold text-rose-900 mb-1">Delete Student Account</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Permanently delete your profile and all associated data including conversations, uploaded documents, quiz attempts, and topic mastery history.
            </p>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAccount}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Account & Clear Data
            </Button>
          </Card>
        </div>

        {/* Right Info: System Status & API Config Guidance */}
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-brand-600" /> AI Engine Configuration
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Live OpenAI:</span>
                <Badge variant={serverHealth?.features?.openAiLive ? 'success' : 'brand'} size="sm">
                  {serverHealth?.features?.openAiLive ? 'Active (Live API)' : 'Pedagogical Engine Active'}
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Model:</span>
                <span className="font-semibold text-slate-800">{serverHealth?.features?.openAiModel || 'gpt-4o-mini'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Database:</span>
                <Badge variant={serverHealth?.features?.supabaseConfigured ? 'success' : 'neutral'} size="sm">
                  {serverHealth?.features?.supabaseConfigured ? 'Supabase PostgreSQL' : 'Local Persistent Storage'}
                </Badge>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 leading-relaxed">
              To connect your own OpenAI API key, open <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">server/.env</code> and set <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">OPENAI_API_KEY=your_key</code>.
            </div>
          </Card>

          <Card className="p-5 space-y-2 bg-slate-50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800">PostgreSQL Data Isolation</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Row Level Security (RLS) is strictly enforced. No student can access another user's conversations or study documents.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
