// ====================================================================
// LearnMate AI - Profile & Session Routes
// ====================================================================
import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { db } from '../services/db';
import { ProfileUpdateSchema } from '../schemas/validation';

const router = Router();

// GET /api/profile
router.get('/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    let profile = await db.getProfile(userId);

    if (!profile) {
      // Create empty default profile for newly registered user
      profile = await db.upsertProfile(userId, {
        display_name: req.user?.email?.split('@')[0] || 'Learner',
        is_onboarded: false,
      });
    }

    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/profile
router.patch('/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validatedData = ProfileUpdateSchema.parse(req.body);

    const updated = await db.upsertProfile(userId, {
      ...validatedData,
      target_completion_date: validatedData.target_completion_date || undefined,
      is_onboarded: true,
    });

    res.json({
      message: 'Profile updated successfully',
      profile: updated,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/demo-session (Convenience helper for local exploration without signing up)
router.post('/auth/demo-session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const demoId = req.body.userId || 'demo-student-alex';
    const email = `${demoId}@learnmate.ai`;

    let profile = await db.getProfile(demoId);
    if (!profile) {
      profile = await db.upsertProfile(demoId, {
        display_name: 'Alex Johnson',
        education_level: 'undergraduate',
        field_of_study: 'Computer Science & Cognitive Psychology',
        subjects_of_interest: ['Artificial Intelligence', 'Data Structures', 'Neuroscience'],
        current_knowledge_level: 'intermediate',
        learning_goals: ['Master Machine Learning fundamentals', 'Ace algorithmic problem solving'],
        preferred_language: 'en',
        daily_study_minutes: 45,
        difficult_topics: ['Dynamic Programming', 'Backpropagation derivation'],
        learning_preferences: {
          explanation_style: 'balanced',
          preferred_mode: 'conceptual',
          pace: 'moderate',
        },
        is_onboarded: true,
      });

      // Seed initial mastery topics for meaningful analytics
      await db.updateTopicMastery(demoId, 'Data Structures', true);
      await db.updateTopicMastery(demoId, 'Data Structures', true);
      await db.updateTopicMastery(demoId, 'Algorithms', true);
      await db.updateTopicMastery(demoId, 'Dynamic Programming', false);
    }

    res.json({
      token: demoId,
      user: {
        id: demoId,
        email,
      },
      profile,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
