// ====================================================================
// LearnMate AI - Learning Path Roadmap Details Navigator
// ====================================================================
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  Award,
  Sparkles,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LearningPath } from '../types';

export const LearningPathDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await apiRequest(`/learning-paths/${id}`);
        setPath(res.path || null);
      } catch (err) {
        console.error('Failed to load roadmap:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        Loading personalized learning path...
      </div>
    );
  }

  if (!path) {
    return (
      <div className="text-center py-20 space-y-3">
        <h3 className="text-lg font-bold text-slate-800">Learning Path Not Found</h3>
        <Link to="/learning-paths">
          <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to All Paths
          </Button>
        </Link>
      </div>
    );
  }

  const totalLessons = path.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const completedLessons =
    path.modules?.reduce(
      (acc, m) => acc + (m.lessons?.filter((l) => l.status === 'completed').length || 0),
      0
    ) || 0;
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/learning-paths"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Learning Paths
        </Link>
        <Link to={`/quizzes/new?topic=${encodeURIComponent(path.subject)}`}>
          <Button size="sm" variant="secondary" leftIcon={<Award className="w-3.5 h-3.5" />}>
            Take Path Quiz
          </Button>
        </Link>
      </div>

      {/* Path Header Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-accent-950 text-white p-6 sm:p-8 rounded-3xl shadow-hover">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="brand" className="bg-white/20 text-white border-transparent">
            {path.subject}
          </Badge>
          <Badge variant="neutral" className="bg-white/10 text-brand-200 border-transparent capitalize">
            {path.difficulty}
          </Badge>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{path.title}</h1>
        <p className="mt-2 text-xs sm:text-sm text-brand-200/90 max-w-2xl leading-relaxed">
          {path.description}
        </p>

        {/* Prerequisites */}
        {path.prerequisites && path.prerequisites.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-brand-300 font-semibold">Prerequisites:</span>
            {path.prerequisites.map((p, idx) => (
              <span key={idx} className="bg-white/10 px-2.5 py-0.5 rounded-full text-brand-100 text-[11px]">
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Overall Completion Progress */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex justify-between text-xs font-bold text-brand-200 mb-1.5">
            <span>Overall Roadmap Completion</span>
            <span>{completedLessons} of {totalLessons} Lessons ({progressPct}%)</span>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Modules and Lessons Hierarchy */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand-600" /> Curriculum Modules
        </h2>

        {path.modules?.map((mod, modIdx) => (
          <Card key={mod.id} className="overflow-hidden">
            <div className="bg-slate-50 p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  Module {modIdx + 1}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">{mod.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {mod.lessons?.length || 0} Lessons
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {mod.lessons?.map((lesson, lessonIdx) => {
                const isCompleted = lesson.status === 'completed';

                return (
                  <div
                    key={lesson.id}
                    className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : lessonIdx + 1}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                          {lesson.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> ~{lesson.estimated_minutes} mins
                          </span>
                          <span>•</span>
                          <span className={isCompleted ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                            {isCompleted ? 'Completed' : 'Not Started'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link to={`/lessons/${lesson.id}`}>
                      <Button
                        size="sm"
                        variant={isCompleted ? 'outline' : 'primary'}
                        className="text-xs py-1.5 px-3"
                        rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                      >
                        {isCompleted ? 'Review' : 'Start Lesson'}
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
