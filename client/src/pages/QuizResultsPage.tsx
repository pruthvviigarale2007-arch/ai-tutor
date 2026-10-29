// ====================================================================
// LearnMate AI - Quiz Assessment Results & Explanations
// ====================================================================
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { QuizAttempt } from '../types';

export const QuizResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<QuizAttempt | null>(
    (location.state as any)?.attempt || null
  );
  const [isLoading, setIsLoading] = useState(!attempt);

  useEffect(() => {
    async function loadAttempt() {
      if (attempt) {
        if (attempt.score >= 80) {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        }
        return;
      }

      try {
        const res = await apiRequest(`/quizzes/${id}/results`);
        if (res.attempts?.length > 0) {
          setAttempt(res.attempts[0]);
          if (res.attempts[0].score >= 80) {
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          }
        }
      } catch (err) {
        console.error('Failed to load results:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAttempt();
  }, [id, attempt]);

  if (isLoading) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        Calculating assessment evaluation...
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="text-center py-20 space-y-3">
        <h3 className="text-lg font-bold text-slate-800">Results Unavailable</h3>
        <Link to="/quizzes">
          <Button variant="secondary">Back to Practice</Button>
        </Link>
      </div>
    );
  }

  const isPassed = attempt.score >= 70;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Score Summary Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl text-white shadow-card text-center space-y-3 ${
          isPassed
            ? 'bg-gradient-to-r from-emerald-800 via-teal-900 to-brand-900'
            : 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950'
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md">
          <Award className="w-3.5 h-3.5" />
          <span>Assessment Completed</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">{attempt.score}%</h1>
        <p className="text-xs sm:text-sm text-slate-200 font-medium">
          You answered {attempt.correct_count} of {attempt.total_questions} questions correctly.
        </p>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          {isPassed
            ? 'Great job! Your topic mastery rating has increased. Review the explanations below to cement retention.'
            : 'A good learning opportunity. Review the correct explanations below to clear up misconceptions.'}
        </p>

        <div className="pt-2 flex justify-center gap-3">
          <Link to="/quizzes">
            <Button size="sm" variant="secondary" className="bg-white text-slate-900 font-bold" leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
              Take Another Quiz
            </Button>
          </Link>
          <Link to="/analytics">
            <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10" rightIcon={<TrendingUp className="w-3.5 h-3.5" />}>
              View Updated Mastery
            </Button>
          </Link>
        </div>
      </div>

      {/* Detailed Question Explanations Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-600" /> Question Breakdown & Explanations
        </h2>

        {attempt.answers?.map((ans, idx) => (
          <Card key={idx} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Question {idx + 1} • {ans.topic}
                </span>
                <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                  {ans.questionText}
                </h4>
              </div>
              <Badge variant={ans.isCorrect ? 'success' : 'danger'} size="sm" className="shrink-0 gap-1">
                {ans.isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {ans.isCorrect ? 'Correct' : 'Incorrect'}
              </Badge>
            </div>

            {/* Answer comparisons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Your Answer</span>
                <span className={`font-semibold ${ans.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {ans.selectedAnswer || '(No answer provided)'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-0.5">Correct Answer</span>
                <span className="font-semibold text-emerald-900">{ans.correctAnswer}</span>
              </div>
            </div>

            {/* Pedagogical Explanation */}
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
              <span className="font-bold text-slate-900 block mb-0.5">Detailed Explanation:</span>
              {ans.explanation}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
