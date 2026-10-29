// ====================================================================
// LearnMate AI - Personalized Learning Paths Routes
// ====================================================================
import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { db } from '../services/db';
import { ai } from '../services/ai';
import { LearningPathGenerateSchema } from '../schemas/validation';

const router = Router();

// GET /api/learning-paths
router.get('/learning-paths', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const paths = await db.getLearningPaths(userId);
    res.json({ paths });
  } catch (err) {
    next(err);
  }
});

// GET /api/learning-paths/:id
router.get('/learning-paths/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const pathId = req.params.id;
    const path = await db.getLearningPath(userId, pathId);

    if (!path) {
      res.status(404).json({ error: 'Not Found', message: 'Learning path not found or access denied.' });
      return;
    }

    res.json({ path });
  } catch (err) {
    next(err);
  }
});

// POST /api/learning-paths/generate
router.post('/learning-paths/generate', requireAuth, rateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = LearningPathGenerateSchema.parse(req.body);

    // Call AI to generate structured curriculum
    const generated = await ai.generateLearningPath({
      subject: validated.subject,
      currentKnowledgeLevel: validated.currentKnowledgeLevel,
      learningObjective: validated.learningObjective,
      availableHoursPerWeek: validated.availableHoursPerWeek,
      preferredLessonStyle: validated.preferredLessonStyle,
    });

    // Validate generated curriculum structure
    if (!generated.title || !Array.isArray(generated.modules)) {
      throw new Error('AI curriculum generation produced an invalid roadmap structure.');
    }

    // Persist into database with modules and lessons
    const createdPath = await db.createLearningPath(
      userId,
      {
        title: generated.title,
        description: generated.description || `Learning path for ${validated.subject}`,
        subject: validated.subject,
        difficulty: validated.currentKnowledgeLevel,
        target_date: validated.targetDate,
        status: 'in_progress',
        prerequisites: generated.prerequisites || [],
      },
      generated.modules
    );

    res.status(201).json({
      message: 'Learning path generated and saved successfully',
      path: createdPath,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/learning-paths/:id
router.patch('/learning-paths/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const pathId = req.params.id;
    const { status } = req.body;

    const path = await db.getLearningPath(userId, pathId);
    if (!path) {
      res.status(404).json({ error: 'Not Found', message: 'Learning path not found or access denied.' });
      return;
    }

    if (status && ['in_progress', 'completed', 'paused'].includes(status)) {
      path.status = status;
      // In db service, updates are handled directly
    }

    res.json({ message: 'Learning path updated', path });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/learning-paths/:id
router.delete('/learning-paths/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const pathId = req.params.id;

    const deleted = await db.deleteLearningPath(userId, pathId);
    if (!deleted) {
      res.status(404).json({ error: 'Not Found', message: 'Learning path not found or access denied.' });
      return;
    }

    res.json({ message: 'Learning path deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
