// ====================================================================
// LearnMate AI - Comprehensive Lesson Reader
// 9 structured pedagogical components, interactive practice checks,
// and completion tracking.
// ====================================================================
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Bot,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Lesson } from '../types';

export const LessonReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await apiRequest(`/lessons/${id}`);
        setLesson(res.lesson || null);
      } catch (err) {
        console.error('Failed to load lesson:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const toggleReveal = (idx: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleComplete = async () => {
    if (!lesson) return;
    setIsCompleting(true);
    try {
      await apiRequest(`/lessons/${lesson.id}/complete`, { method: 'POST' });
      setLesson((prev) => (prev ? { ...prev, status: 'completed' } : null));

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        Loading lesson content...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-20 space-y-3">
        <h3 className="text-lg font-bold text-slate-800">Lesson Not Found</h3>
        <Link to="/learning-paths">
          <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Roadmaps
          </Button>
        </Link>
      </div>
    );
  }

  const content = lesson.content || {};
  const isCompleted = lesson.status === 'completed';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Roadmap
        </button>

        <div className="flex items-center gap-2">
          <Link to={`/tutor?prompt=${encodeURIComponent(`I have a question about ${lesson.title}`)}`}>
            <Button size="sm" variant="secondary" leftIcon={<Bot className="w-3.5 h-3.5" />}>
              Discuss with AI Tutor
            </Button>
          </Link>
        </div>
      </div>

      {/* Lesson Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">Lesson</Badge>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> ~{lesson.estimated_minutes} minutes
          </span>
          {isCompleted && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="w-3 h-3" /> Completed
            </Badge>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {lesson.title}
        </h1>

        {/* 1. Overview */}
        {content.overview && (
          <p className="text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
            {content.overview}
          </p>
        )}

        {/* 2. Learning Objectives */}
        {content.objectives && content.objectives.length > 0 && (
          <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" /> Learning Objectives
            </h4>
            <ul className="space-y-1.5">
              {content.objectives.map((obj: string, idx: number) => (
                <li key={idx} className="text-xs text-brand-950 flex items-start gap-2">
                  <span className="text-brand-500 font-bold">•</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 3. Core Explanation */}
      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-600" /> Core Concepts & Mechanism
        </h2>
        <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed space-y-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content.explanation || 'No content available for this lesson.'}
          </ReactMarkdown>
        </div>
      </Card>

      {/* 4. Worked Examples */}
      {content.examples && content.examples.length > 0 && (
        <Card className="p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" /> Worked Examples & Applications
          </h2>
          <div className="space-y-4">
            {content.examples.map((ex: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h4 className="text-sm font-bold text-slate-900">{ex.title}</h4>
                <p className="text-xs text-slate-600">{ex.explanation}</p>
                {ex.codeOrSteps && (
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs overflow-x-auto font-mono mt-2">
                    <code>{ex.codeOrSteps}</code>
                  </pre>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5. Key Terminology */}
      {content.keyTerminology && content.keyTerminology.length > 0 && (
        <Card className="p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Essential Terminology
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {content.keyTerminology.map((term: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs font-bold text-brand-700 block">{term.term}</span>
                <span className="text-xs text-slate-600 mt-1 block leading-relaxed">{term.definition}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 6. Common Misconceptions */}
      {content.misconceptions && content.misconceptions.length > 0 && (
        <Card className="p-6 sm:p-8 space-y-4 border-amber-200/80 bg-amber-50/20">
          <h2 className="text-base font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Common Misconceptions to Avoid
          </h2>
          <div className="space-y-3">
            {content.misconceptions.map((m: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-white border border-amber-200 space-y-1">
                <p className="text-xs text-rose-700 font-semibold line-through">{m.misconception}</p>
                <p className="text-xs text-slate-700">{m.clarification}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 7. Practice Questions (with Interactive Reveal) */}
      {content.practiceQuestions && content.practiceQuestions.length > 0 && (
        <Card className="p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-600" /> Check Your Understanding
          </h2>
          <div className="space-y-3">
            {content.practiceQuestions.map((q: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <p className="text-xs font-bold text-slate-900">{idx + 1}. {q.question}</p>
                {q.hint && (
                  <p className="text-[11px] text-brand-700 italic">💡 Hint: {q.hint}</p>
                )}
                <div>
                  <button
                    onClick={() => toggleReveal(idx)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline"
                  >
                    {revealedAnswers[idx] ? 'Hide Answer' : 'Show Answer & Explanation'}
                  </button>
                  {revealedAnswers[idx] && (
                    <div className="mt-2 p-3 bg-white rounded-xl border border-emerald-200 text-xs text-slate-800 animate-fade-in">
                      <span className="font-bold text-emerald-700">Answer: </span>
                      {q.answer}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 8. Summary & 9. Further Study */}
      {content.summary && (
        <div className="p-6 rounded-2xl bg-slate-100/80 border border-slate-200 text-slate-800 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Lesson Summary</h4>
          <p className="text-xs leading-relaxed">{content.summary}</p>
        </div>
      )}

      {/* AI Accuracy Notice required by Prompt */}
      <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2.5 text-[11px] text-slate-500">
        <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          Educational notice: AI-generated learning explanations are designed for intuitive conceptual guidance and may occasionally contain simplifications. Verify critical facts when rigorous academic accuracy is required.
        </span>
      </div>

      {/* Lesson Complete Action Footer */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Finished this lesson?</h4>
          <p className="text-xs text-slate-500">Marking complete updates your streak, study time, and topic mastery score.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleComplete}
            disabled={isCompleted}
            isLoading={isCompleting}
            variant={isCompleted ? 'secondary' : 'primary'}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isCompleted ? 'Lesson Completed' : 'Mark Lesson Complete'}
          </Button>
        </div>
      </div>
    </div>
  );
};
