// ====================================================================
// LearnMate AI - AI Quiz Setup & Assessment Generator
// ====================================================================
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Award, Plus, Sparkles, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiRequest } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

export const QuizSetupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';
  const navigate = useNavigate();

  const [subject, setSubject] = useState('Computer Science');
  const [topic, setTopic] = useState(initialTopic || 'Algorithms & Data Structures');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<string>('multiple_choice');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);

  useEffect(() => {
    async function loadPastAttempts() {
      try {
        const res = await apiRequest('/analytics/overview');
        if (res?.quizTrends) {
          setRecentAttempts(res.quizTrends);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadPastAttempts();
  }, []);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

    setIsGenerating(true);
    try {
      const res = await apiRequest('/quizzes/generate', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject || 'General',
          topic,
          difficulty,
          questionCount: Number(questionCount),
          questionType,
        }),
      });

      if (res.quiz?.id) {
        navigate(`/quizzes/${res.quiz.id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Quiz generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Practice & Quizzes</h1>
        <p className="text-xs text-slate-500 mt-1">
          Objective assessments to verify understanding and calibrate your topic mastery score
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quiz Generator Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" /> Generate AI Practice Quiz
            </h2>

            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <Input
                label="Subject Area"
                placeholder="e.g. Computer Science, Neuroscience, Economics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />

              <Input
                label="Specific Topic to Test"
                placeholder="e.g. Graph Traversal, DNA Replication, Macroeconomic Inflation"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />

              {/* Difficulty Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Target Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`p-2.5 rounded-xl border text-xs font-bold capitalize text-center transition-all ${
                        difficulty === diff
                          ? 'border-brand-500 bg-brand-50 text-brand-900 ring-1 ring-brand-500'
                          : 'border-slate-200 text-slate-600 bg-white'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Question Count
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value={3}>3 Questions (Quick check)</option>
                    <option value={5}>5 Questions (Standard)</option>
                    <option value={10}>10 Questions (Comprehensive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Question Format
                  </label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True or False</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="fill_in_the_blanks">Fill in the Blanks</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  type="submit"
                  isLoading={isGenerating}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Generate & Start Quiz
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Side Info & Anti-Cheat Security Notice */}
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" /> Transparent Grading
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Objective questions are graded deterministically on the server. Answer keys are strictly withheld from client responses during testing to maintain assessment validity.
            </p>
          </Card>

          <Card className="p-5 space-y-3 bg-gradient-to-br from-brand-50/50 to-white">
            <h3 className="text-sm font-bold text-brand-900">Adaptive Feedback</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              After submitting, you'll receive immediate explanations and targeted recommendations based on your performance.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
