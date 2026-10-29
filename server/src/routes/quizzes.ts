// ====================================================================
// LearnMate AI - AI Quiz Generator & Secure Grading Engine
// ====================================================================
import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { db } from '../services/db';
import { ai } from '../services/ai';
import { QuizGenerateSchema, QuizSubmitSchema } from '../schemas/validation';
import { QuizEvaluationResult } from '../types';

const router = Router();

// POST /api/quizzes/generate
router.post('/quizzes/generate', requireAuth, rateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = QuizGenerateSchema.parse(req.body);

    const generated = await ai.generateQuiz({
      subject: validated.subject,
      topic: validated.topic,
      difficulty: validated.difficulty,
      questionCount: validated.questionCount,
      questionType: validated.questionType,
    });

    const savedQuiz = await db.saveQuiz({
      user_id: userId,
      lesson_id: validated.lessonId,
      title: generated.title || `${validated.topic} Quiz`,
      topic: validated.topic,
      questions: generated.questions || [],
      difficulty: validated.difficulty,
      time_limit_minutes: generated.time_limit_minutes || 10,
    });

    // Strip answers when sending back to the active client taker
    const safeQuestions = savedQuiz.questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
      difficulty: q.difficulty,
      topic: q.topic,
    }));

    res.status(201).json({
      quiz: {
        id: savedQuiz.id,
        title: savedQuiz.title,
        topic: savedQuiz.topic,
        difficulty: savedQuiz.difficulty,
        time_limit_minutes: savedQuiz.time_limit_minutes,
        questions: safeQuestions,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/quizzes/:id (Safe for client: answer keys stripped out!)
router.get('/quizzes/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const quizId = req.params.id;

    const quiz = await db.getQuiz(userId, quizId);
    if (!quiz) {
      res.status(404).json({ error: 'Not Found', message: 'Quiz not found or access denied.' });
      return;
    }

    // Never leak answer key or explanation before submission
    const safeQuestions = quiz.questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
      difficulty: q.difficulty,
      topic: q.topic,
    }));

    res.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        time_limit_minutes: quiz.time_limit_minutes,
        questions: safeQuestions,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/quizzes/:id/submit (Server-Side Deterministic Grading)
router.post('/quizzes/:id/submit', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const quizId = req.params.id;
    const { answers } = QuizSubmitSchema.parse(req.body);

    const quiz = await db.getQuiz(userId, quizId);
    if (!quiz) {
      res.status(404).json({ error: 'Not Found', message: 'Quiz not found or access denied.' });
      return;
    }

    let correctCount = 0;
    const evaluatedAnswers: QuizEvaluationResult[] = [];

    // Evaluate each question deterministically on server
    for (const q of quiz.questions) {
      const userSubmission = answers.find((a) => a.questionId === q.id);
      const selectedAnswer = userSubmission?.selectedAnswer?.trim() || '';

      let isCorrect = false;
      const expected = q.correctAnswer.trim();

      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        isCorrect = selectedAnswer.toLowerCase() === expected.toLowerCase();
      } else {
        // Short answer & Fill-in-the-blanks: fuzzy normalization & key phrase inclusion
        const normUser = selectedAnswer.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const normExpected = expected.toLowerCase().replace(/[^\w\s]/g, '').trim();
        isCorrect =
          normUser === normExpected ||
          normUser.includes(normExpected) ||
          normExpected.includes(normUser);
      }

      if (isCorrect) correctCount++;

      // Update topic mastery score in database
      await db.updateTopicMastery(userId, q.topic || quiz.topic, isCorrect);

      evaluatedAnswers.push({
        questionId: q.id,
        questionText: q.question,
        type: q.type,
        selectedAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic || quiz.topic,
      });
    }

    const totalQuestions = quiz.questions.length;
    const score = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);

    // Save attempt record
    const attempt = await db.saveQuizAttempt({
      user_id: userId,
      quiz_id: quizId,
      score,
      total_questions: totalQuestions,
      correct_count: correctCount,
      answers: evaluatedAnswers,
    });

    res.json({
      message: 'Quiz evaluated and submitted successfully',
      attempt,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/quizzes/:id/results (Get recent attempt results)
router.get('/quizzes/:id/results', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const quizId = req.params.id;

    const attempts = await db.getQuizAttempts(userId, quizId);
    res.json({ attempts });
  } catch (err) {
    next(err);
  }
});

export default router;
