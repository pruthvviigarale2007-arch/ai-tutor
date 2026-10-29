// ====================================================================
// LearnMate AI - Study Planner Routes
// ====================================================================
import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { db } from '../services/db';
import { StudySessionSchema } from '../schemas/validation';

const router = Router();

// GET /api/study-plan
router.get('/study-plan', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const sessions = await db.getStudySessions(userId);
    const profile = await db.getProfile(userId);

    // Group by status
    const scheduled = sessions.filter((s) => s.status === 'scheduled');
    const completed = sessions.filter((s) => s.status === 'completed');

    // Auto-generate realistic smart schedule suggestions if user has 0 sessions
    if (sessions.length === 0 && profile?.subjects_of_interest?.length) {
      const suggestedTopics = profile.subjects_of_interest;
      const today = new Date();

      for (let i = 0; i < Math.min(3, suggestedTopics.length); i++) {
        const sessionDate = new Date(today);
        sessionDate.setDate(today.getDate() + i);
        sessionDate.setHours(18, 0, 0, 0);

        await db.createStudySession(userId, {
          topic: suggestedTopics[i],
          planned_minutes: profile.daily_study_minutes || 30,
          actual_minutes: 0,
          scheduled_at: sessionDate.toISOString(),
          status: 'scheduled',
          notes: 'Suggested based on your onboarding subjects of interest',
        });
      }
    }

    const updatedSessions = await db.getStudySessions(userId);

    res.json({
      sessions: updatedSessions,
      weeklyGoalMinutes: (profile?.daily_study_minutes || 30) * 5,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/study-sessions
router.post('/study-sessions', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = StudySessionSchema.parse(req.body);

    const session = await db.createStudySession(userId, {
      topic: validated.topic,
      planned_minutes: validated.planned_minutes,
      actual_minutes: 0,
      scheduled_at: validated.scheduled_at,
      status: 'scheduled',
      notes: validated.notes,
    });

    res.status(201).json({
      message: 'Study session scheduled successfully',
      session,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/study-sessions/:id
router.patch('/study-sessions/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const sessionId = req.params.id;
    const { status, actual_minutes, scheduled_at, notes } = req.body;

    const updated = await db.updateStudySession(userId, sessionId, {
      ...(status && { status }),
      ...(typeof actual_minutes === 'number' && { actual_minutes }),
      ...(scheduled_at && { scheduled_at }),
      ...(notes !== undefined && { notes }),
    });

    if (!updated) {
      res.status(404).json({ error: 'Not Found', message: 'Study session not found or access denied.' });
      return;
    }

    res.json({
      message: 'Study session updated successfully',
      session: updated,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/study-sessions/:id
router.delete('/study-sessions/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const sessionId = req.params.id;

    const deleted = await db.deleteStudySession(userId, sessionId);
    if (!deleted) {
      res.status(404).json({ error: 'Not Found', message: 'Study session not found or access denied.' });
      return;
    }

    res.json({ message: 'Study session deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
