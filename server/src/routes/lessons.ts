// ====================================================================
// LearnMate AI - AI Lesson Generator & Reader Routes
// ====================================================================
import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { db } from '../services/db';
import { ai } from '../services/ai';
import { LessonGenerateSchema } from '../schemas/validation';

const router = Router();

// GET /api/lessons/:id
router.get('/lessons/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const lessonId = req.params.id;

    const lesson = await db.getLesson(userId, lessonId);
    if (!lesson) {
      res.status(404).json({ error: 'Not Found', message: 'Lesson not found.' });
      return;
    }

    res.json({ lesson });
  } catch (err) {
    next(err);
  }
});

// POST /api/lessons/:id/complete
router.post('/lessons/:id/complete', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const lessonId = req.params.id;

    const lesson = await db.getLesson(userId, lessonId);
    if (!lesson) {
      res.status(404).json({ error: 'Not Found', message: 'Lesson not found.' });
      return;
    }

    const progress = await db.updateLessonProgress(userId, lessonId, 'completed');

    // Also update topic mastery positively for completing the lesson
    const topic = lesson.title.split(':')[0].trim();
    await db.updateTopicMastery(userId, topic, true);

    res.json({
      message: 'Lesson marked as completed',
      progress,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/lessons/generate (Standalone custom lesson generator)
router.post('/lessons/generate', requireAuth, rateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = LessonGenerateSchema.parse(req.body);

    const generated = await ai.generateLesson({
      topic: validated.topic,
      educationLevel: validated.educationLevel,
      desiredLessonLength: validated.desiredLessonLength,
      explanationStyle: validated.explanationStyle,
      preferredLanguage: validated.preferredLanguage,
      difficultyLevel: validated.difficultyLevel,
    });

    res.json({
      lesson: {
        title: generated.title || validated.topic,
        content: generated.content,
        estimated_minutes: generated.estimated_minutes || 25,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
