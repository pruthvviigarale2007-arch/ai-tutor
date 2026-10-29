// ====================================================================
// LearnMate AI - Personalized Study Planner & Timetable
// Schedule sessions, estimate duration, track completion, reschedule
// ====================================================================
import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { StudySession } from '../types';

export const StudyPlannerPage: React.FC = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [weeklyGoalMinutes, setWeeklyGoalMinutes] = useState(150);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form inputs
  const [topic, setTopic] = useState('');
  const [plannedMinutes, setPlannedMinutes] = useState(30);
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/study-plan');
      setSessions(res.sessions || []);
      if (res.weeklyGoalMinutes) setWeeklyGoalMinutes(res.weeklyGoalMinutes);
    } catch (err) {
      console.error('Failed to load study plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !scheduledAt) return;

    try {
      const res = await apiRequest('/study-sessions', {
        method: 'POST',
        body: JSON.stringify({
          topic,
          planned_minutes: Number(plannedMinutes),
          scheduled_at: new Date(scheduledAt).toISOString(),
          notes,
        }),
      });

      setSessions((prev) => [...prev, res.session]);
      setIsModalOpen(false);
      setTopic('');
      setNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to schedule session.');
    }
  };

  const handleToggleComplete = async (session: StudySession) => {
    const nextStatus = session.status === 'completed' ? 'scheduled' : 'completed';
    const actualMinutes = nextStatus === 'completed' ? session.planned_minutes : 0;

    try {
      const res = await apiRequest(`/study-sessions/${session.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, actual_minutes: actualMinutes }),
      });

      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? res.session : s))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await apiRequest(`/study-sessions/${sessionId}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error(err);
    }
  };

  const completedMinutes = sessions
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + (s.actual_minutes || s.planned_minutes), 0);

  const goalPct = Math.min(100, Math.round((completedMinutes / Math.max(1, weeklyGoalMinutes)) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personalized Study Planner</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize learning sessions and maintain steady weekly progress
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Schedule Session
        </Button>
      </div>

      {/* Weekly Progress Banner */}
      <Card className="p-6 bg-gradient-to-r from-brand-50/70 via-white to-slate-50 border-brand-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block mb-0.5">
              Weekly Target Progress
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {completedMinutes} of {weeklyGoalMinutes} minutes completed ({goalPct}%)
            </h3>
          </div>
          <Badge variant="brand" size="md">
            {weeklyGoalMinutes / 60} hrs/week target
          </Badge>
        </div>

        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-brand-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${goalPct}%` }}
          />
        </div>
      </Card>

      {/* Timetable / Sessions List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
          Scheduled & Active Sessions
        </h3>

        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((s) => {
              const isDone = s.status === 'completed';
              const sessionDate = new Date(s.scheduled_at);

              return (
                <Card
                  key={s.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isDone ? 'bg-slate-50/80 border-slate-200' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => handleToggleComplete(s)}
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isDone
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 hover:border-brand-500'
                      }`}
                      title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {isDone && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <div>
                      <h4 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {s.topic}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          {sessionDate.toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({s.planned_minutes}m)
                        </span>
                        {s.notes && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 italic">"{s.notes}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Badge variant={isDone ? 'success' : 'brand'} size="sm">
                      {s.status}
                    </Badge>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No scheduled sessions</h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Block out focused study time to maintain consistent learning momentum.
            </p>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              Schedule a Study Session
            </Button>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule a Study Session"
        description="Block out focused time for a specific topic or module"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <Input
            label="Topic or Objective"
            placeholder="e.g. Master Binary Search Trees, Review Biology Notes"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Planned Duration (mins)
              </label>
              <select
                value={plannedMinutes}
                onChange={(e) => setPlannedMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              >
                <option value={15}>15 mins (Quick review)</option>
                <option value={30}>30 mins (Standard lesson)</option>
                <option value={45}>45 mins (Deep dive)</option>
                <option value={60}>60 mins (Intensive sprint)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                required
              />
            </div>
          </div>

          <Input
            label="Notes (Optional)"
            placeholder="e.g. Focus on edge cases and solve the 3 practice questions"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Schedule Session</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
