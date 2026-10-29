// ====================================================================
// LearnMate AI - Flashcards & Active Recall Routes (SM-2)
// ====================================================================
import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { db } from '../services/db';
import { ai } from '../services/ai';
import { spacedRepetition } from '../services/spacedRepetition';
import { FlashcardGenerateSchema, FlashcardReviewSchema } from '../schemas/validation';

const router = Router();

// GET /api/flashcards
router.get('/flashcards', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const cards = await db.getFlashcards(userId);

    const now = new Date();
    const dueCount = cards.filter((c) => new Date(c.next_review_at) <= now).length;

    res.json({
      flashcards: cards,
      totalCount: cards.length,
      dueCount,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/flashcards/generate
router.post('/flashcards/generate', requireAuth, rateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = FlashcardGenerateSchema.parse(req.body);

    let sourceContext: string | undefined;

    if (validated.sourceType === 'document' && validated.sourceId) {
      const doc = await db.getStudyDocument(userId, validated.sourceId);
      if (doc) {
        const chunks = await db.getDocumentChunks(doc.id);
        sourceContext = chunks.slice(0, 5).map((c) => c.chunk_text).join('\n\n');
      }
    } else if (validated.sourceType === 'lesson' && validated.sourceId) {
      const lesson = await db.getLesson(userId, validated.sourceId);
      if (lesson) {
        sourceContext = JSON.stringify(lesson.content);
      }
    }

    const generated = await ai.generateFlashcards({
      topic: validated.topic,
      count: validated.count,
      sourceContext,
    });

    const cardsToSave = (generated.flashcards || []).map((card: any) => ({
      user_id: userId,
      topic: card.topic || validated.topic,
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty || 'medium',
      next_review_at: new Date().toISOString(),
      review_interval: 1,
      ease_factor: 2.5,
      review_count: 0,
      source_ref: validated.sourceId || undefined,
    }));

    const saved = await db.saveFlashcards(cardsToSave);

    res.status(201).json({
      message: 'Flashcards generated successfully',
      flashcards: saved,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/flashcards/:id/review (Submit Easy / Medium / Hard active recall rating)
router.post('/flashcards/:id/review', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const cardId = req.params.id;
    const { rating } = FlashcardReviewSchema.parse(req.body);

    const cards = await db.getFlashcards(userId);
    const card = cards.find((c) => c.id === cardId);

    if (!card) {
      res.status(404).json({ error: 'Not Found', message: 'Flashcard not found or access denied.' });
      return;
    }

    // Calculate next interval using SM-2
    const sm2Result = spacedRepetition.calculateNextReview(
      card.review_interval,
      card.ease_factor,
      card.review_count,
      rating
    );

    const updated = await db.updateFlashcardReview(userId, cardId, {
      next_review_at: sm2Result.nextReviewAt,
      review_interval: sm2Result.reviewInterval,
      ease_factor: sm2Result.easeFactor,
      review_count: sm2Result.reviewCount,
    });

    // Also update topic mastery
    await db.updateTopicMastery(userId, card.topic, rating !== 'hard');

    res.json({
      message: 'Flashcard review recorded',
      flashcard: updated,
      sm2: sm2Result,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/flashcards/:id
router.delete('/flashcards/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const cardId = req.params.id;

    const deleted = await db.deleteFlashcard(userId, cardId);
    if (!deleted) {
      res.status(404).json({ error: 'Not Found', message: 'Flashcard not found or access denied.' });
      return;
    }

    res.json({ message: 'Flashcard deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
