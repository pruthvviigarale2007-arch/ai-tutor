// ====================================================================
// LearnMate AI - Learning Paths Directory & Generator
// ====================================================================
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Plus,
  ArrowRight,
  BookOpen,
  Clock,
  Sparkles,
  Trash2,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { LearningPath } from '../types';

export const LearningPathsPage: React.FC = () => {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  // Generator form inputs
  const [subject, setSubject] = useState('');
  const [currentKnowledgeLevel, setCurrentKnowledgeLevel] = useState('intermediate');
  const [learningObjective, setLearningObjective] = useState('');
  const [availableHoursPerWeek, setAvailableHoursPerWeek] = useState(5);
  const [preferredLessonStyle, setPreferredLessonStyle] = useState('balanced');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    loadPaths();
  }, []);

  const loadPaths = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/learning-paths');
      setPaths(res.paths || []);
    } catch (err) {
      console.error('Failed to load learning paths:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !learningObjective) return;

    setIsGenerating(true);
    try {
      const res = await apiRequest<{ path: LearningPath }>('/learning-paths/generate', {
        method: 'POST',
        body: JSON.stringify({
          subject,
          currentKnowledgeLevel,
          learningObjective,
          availableHoursPerWeek: Number(availableHoursPerWeek),
          preferredLessonStyle,
          targetDate: targetDate || undefined,
        }),
      });

      setIsModalOpen(false);
      setSubject('');
      setLearningObjective('');
      navigate(`/learning-paths/${res.path.id}`);
    } catch (err: any) {
      alert(err.message || 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (pathId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this learning path?')) return;
    try {
      await apiRequest(`/learning-paths/${pathId}`, { method: 'DELETE' });
      setPaths((prev) => prev.filter((p) => p.id !== pathId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Learning Paths</h1>
          <p className="text-xs text-slate-500 mt-1">
            Structured, AI-curated roadmaps tailored to your available hours and goals
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm"
        >
          Generate New Learning Path
        </Button>
      </div>

      {/* Roadmaps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paths.map((p) => {
          const totalLessons = p.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
          const completedLessons =
            p.modules?.reduce(
              (acc, m) => acc + (m.lessons?.filter((l) => l.status === 'completed').length || 0),
              0
            ) || 0;
          const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

          return (
            <Card
              key={p.id}
              onClick={() => navigate(`/learning-paths/${p.id}`)}
              className="p-5 flex flex-col justify-between cursor-pointer hover:border-brand-400 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="brand" size="sm">{p.subject}</Badge>
                  <Badge variant={p.status === 'completed' ? 'success' : 'neutral'} size="sm">
                    {p.difficulty}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Progress ({completedLessons}/{totalLessons} lessons)</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 h-full rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  {p.modules?.length || 0} Modules
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(p.id, e)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete path"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {paths.length === 0 && !isLoading && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8 max-w-lg mx-auto">
          <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Learning Paths Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Tell LearnMate AI what skill or subject you want to master, and it will build an optimized roadmap.
          </p>
          <Button onClick={() => setIsModalOpen(true)} leftIcon={<Sparkles className="w-4 h-4" />}>
            Generate Your First Path
          </Button>
        </div>
      )}

      {/* Generator Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isGenerating && setIsModalOpen(false)}
        title="Generate AI Learning Path"
        description="Provide your objective and our pedagogical engine will generate a structured curriculum."
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <Input
            label="Subject or Skill to Master"
            placeholder="e.g. Distributed Systems, Machine Learning Foundations, Organic Chemistry"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Current Knowledge Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setCurrentKnowledgeLevel(lvl)}
                  className={`p-2.5 rounded-xl border text-xs font-medium capitalize text-center transition-all ${
                    currentKnowledgeLevel === lvl
                      ? 'border-brand-500 bg-brand-50 text-brand-900 font-bold'
                      : 'border-slate-200 text-slate-700 bg-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Primary Learning Objective"
            placeholder="e.g. Build an intuition for consensus algorithms and master Paxos/Raft"
            value={learningObjective}
            onChange={(e) => setLearningObjective(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Hours Per Week: {availableHoursPerWeek}h
              </label>
              <input
                type="range"
                min="2"
                max="30"
                value={availableHoursPerWeek}
                onChange={(e) => setAvailableHoursPerWeek(Number(e.target.value))}
                className="w-full accent-brand-600 mt-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isGenerating} leftIcon={<Sparkles className="w-4 h-4" />}>
              Generate Roadmap
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
