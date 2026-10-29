// ====================================================================
// LearnMate AI - 10-Point Student Onboarding Wizard
// ====================================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Target,
  Clock,
  Sliders,
  Plus,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EducationLevel, KnowledgeLevel, TutorMode } from '../types';

export const OnboardingPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 10 Onboarding Parameters
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(
    profile?.education_level || 'undergraduate'
  );
  const [fieldOfStudy, setFieldOfStudy] = useState(profile?.field_of_study || 'Computer Science');
  const [subjectsOfInterest, setSubjectsOfInterest] = useState<string[]>(
    profile?.subjects_of_interest?.length ? profile.subjects_of_interest : ['Algorithms', 'Machine Learning']
  );
  const [currentKnowledgeLevel, setCurrentKnowledgeLevel] = useState<KnowledgeLevel>(
    profile?.current_knowledge_level || 'intermediate'
  );
  const [learningGoals, setLearningGoals] = useState<string[]>(
    profile?.learning_goals?.length ? profile.learning_goals : ['Build deep algorithmic problem solving intuition']
  );
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_language || 'en');
  const [dailyStudyMinutes, setDailyStudyMinutes] = useState(profile?.daily_study_minutes || 30);
  const [targetDate, setTargetDate] = useState(profile?.target_completion_date || '');
  const [difficultTopics, setDifficultTopics] = useState<string[]>(
    profile?.difficult_topics?.length ? profile.difficult_topics : ['Dynamic Programming']
  );

  // Preference details
  const [explanationStyle, setExplanationStyle] = useState<'simple' | 'detailed' | 'socratic' | 'practical' | 'balanced'>('balanced');
  const [preferredMode, setPreferredMode] = useState<TutorMode>('conceptual');
  const [pace, setPace] = useState<'gentle' | 'moderate' | 'accelerated'>('moderate');

  // Input helpers
  const [newSubject, setNewSubject] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newDifficultTopic, setNewDifficultTopic] = useState('');

  const addTag = (val: string, list: string[], setList: (vals: string[]) => void, clearInput: () => void) => {
    const trimmed = val.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      clearInput();
    }
  };

  const removeTag = (item: string, list: string[], setList: (vals: string[]) => void) => {
    setList(list.filter((t) => t !== item));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest('/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          display_name: displayName || 'Student',
          education_level: educationLevel,
          field_of_study: fieldOfStudy,
          subjects_of_interest: subjectsOfInterest,
          current_knowledge_level: currentKnowledgeLevel,
          learning_goals: learningGoals,
          preferred_language: preferredLanguage,
          daily_study_minutes: Number(dailyStudyMinutes),
          target_completion_date: targetDate || null,
          difficult_topics: difficultTopics,
          learning_preferences: {
            explanation_style: explanationStyle,
            preferred_mode: preferredMode,
            pace,
          },
        }),
      });

      await refreshProfile();
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Failed to save onboarding:', err);
      // Still navigate so user is never blocked
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-3 border border-brand-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personalized Tutor Calibration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Let's Personalize Your AI Tutor
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Step {step} of 4 — Help LearnMate AI tailor every lesson and quiz to your exact level
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-6 overflow-hidden">
            <div
              className="bg-brand-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Card Container */}
        <Card className="p-6 sm:p-8">
          {/* STEP 1: Academic Background */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <GraduationCap className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900">1. Academic & Background Context</h3>
              </div>

              <Input
                label="What should your tutor call you?"
                placeholder="e.g. Alex"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Current Education Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'middle_school', label: 'Middle School' },
                    { id: 'high_school', label: 'High School' },
                    { id: 'undergraduate', label: 'Undergraduate' },
                    { id: 'postgraduate', label: 'Postgraduate' },
                    { id: 'professional_lifelong', label: 'Lifelong Learner' },
                  ].map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setEducationLevel(level.id as EducationLevel)}
                      className={`p-3 rounded-xl text-xs font-medium border text-left transition-all ${
                        educationLevel === level.id
                          ? 'border-brand-500 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Field of Study or Major"
                placeholder="e.g. Cognitive Neuroscience, Computer Engineering, Economics"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Current Knowledge Level in Target Subject
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'beginner', title: 'Beginner', desc: 'Starting from square one' },
                    { id: 'intermediate', title: 'Intermediate', desc: 'Know fundamentals well' },
                    { id: 'advanced', title: 'Advanced', desc: 'Seeking deep mastery' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setCurrentKnowledgeLevel(lvl.id as KnowledgeLevel)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        currentKnowledgeLevel === lvl.id
                          ? 'border-brand-500 bg-brand-50 text-brand-900 ring-1 ring-brand-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <p className="font-bold text-xs">{lvl.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{lvl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Subjects of Interest & Difficult Areas */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <Target className="w-5 h-5 text-accent-600" />
                <h3 className="text-base font-bold text-slate-900">2. Subjects & Focus Areas</h3>
              </div>

              {/* Subjects of Interest */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Subjects You Wish to Master
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Linear Algebra, Distributed Systems"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newSubject, subjectsOfInterest, setSubjectsOfInterest, () => setNewSubject('')))}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => addTag(newSubject, subjectsOfInterest, setSubjectsOfInterest, () => setNewSubject(''))}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                  {subjectsOfInterest.map((s) => (
                    <Badge key={s} variant="brand" className="gap-1.5 py-1">
                      {s}
                      <button onClick={() => removeTag(s, subjectsOfInterest, setSubjectsOfInterest)} className="hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Difficult Topics */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Specific Topics You Find Difficult (AI will give extra guidance)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Dynamic Programming, Recursion, Quantum Entanglement"
                    value={newDifficultTopic}
                    onChange={(e) => setNewDifficultTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newDifficultTopic, difficultTopics, setDifficultTopics, () => setNewDifficultTopic('')))}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => addTag(newDifficultTopic, difficultTopics, setDifficultTopics, () => setNewDifficultTopic(''))}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                  {difficultTopics.map((dt) => (
                    <Badge key={dt} variant="danger" className="gap-1.5 py-1">
                      {dt}
                      <button onClick={() => removeTag(dt, difficultTopics, setDifficultTopics)} className="hover:text-rose-900">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Primary Learning Goals */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Your Primary Learning Goals
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Prepare for university finals, Build real ML apps"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newGoal, learningGoals, setLearningGoals, () => setNewGoal('')))}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => addTag(newGoal, learningGoals, setLearningGoals, () => setNewGoal(''))}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                  {learningGoals.map((g) => (
                    <Badge key={g} variant="accent" className="gap-1.5 py-1">
                      {g}
                      <button onClick={() => removeTag(g, learningGoals, setLearningGoals)} className="hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Study Time & Timeline */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">3. Study Schedule & Commitment</h3>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Daily Available Study Time
                  </label>
                  <span className="text-sm font-bold text-brand-600">{dailyStudyMinutes} minutes/day</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={dailyStudyMinutes}
                  onChange={(e) => setDailyStudyMinutes(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>10 mins (Light micro-learning)</span>
                  <span>45 mins (Balanced)</span>
                  <span>120 mins (Intensive)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Target Completion Date (Optional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  If you have an upcoming exam or semester milestone, we will pace your learning path accordingly.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Preferred Explanation Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="en">English (Default)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="zh">Chinese (中文)</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 4: Preferred Tutoring Style */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">4. Pedagogical & Explanation Style</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Default Tutoring Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'conceptual', title: 'Conceptual Mode', desc: 'Deep dive into why & how mechanisms work' },
                    { id: 'socratic', title: 'Socratic Mode', desc: 'Guided inquiry & thought-provoking hints' },
                    { id: 'beginner', title: 'Beginner Mode', desc: 'Simple everyday analogies with no jargon' },
                    { id: 'exam_prep', title: 'Exam Prep Mode', desc: 'High-yield points, marking schemes & traps' },
                    { id: 'practical', title: 'Practical Mode', desc: 'Worked code snippets & live examples' },
                    { id: 'revision', title: 'Revision Mode', desc: 'Rapid active recall & topic summaries' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPreferredMode(m.id as TutorMode)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        preferredMode === m.id
                          ? 'border-brand-500 bg-brand-50 text-brand-900 ring-1 ring-brand-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <p className="font-bold text-xs">{m.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Pacing Preference
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'gentle', label: 'Gentle', desc: 'Plenty of examples' },
                    { id: 'moderate', label: 'Moderate', desc: 'Balanced depth' },
                    { id: 'accelerated', label: 'Accelerated', desc: 'Concise & fast' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPace(p.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        pace === p.id
                          ? 'border-brand-500 bg-brand-50 text-brand-900 ring-1 ring-brand-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <p className="font-bold text-xs">{p.label}</p>
                      <p className="text-[10px] text-slate-500">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(step - 1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Previous Step
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinish}
                isLoading={isSubmitting}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Complete Onboarding
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
