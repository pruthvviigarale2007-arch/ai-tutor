import request from 'supertest';
import app from '../app';
import { db } from '../services/db';
import { spacedRepetition } from '../services/spacedRepetition';
import { masteryEngine } from '../services/mastery';

describe('LearnMate AI - Backend API Test Suite', () => {
  const tokenStudentA = 'user_student_alpha';
  const tokenStudentB = 'user_student_beta';

  describe('1. Health Check & Public Endpoints', () => {
    it('GET /api/health should return status healthy', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.environment).toBeDefined();
    });

    it('GET /api/unknown-endpoint should return 404', async () => {
      const res = await request(app).get('/api/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });
  });

  describe('2. Authentication & Protected Routes', () => {
    it('should reject requests without Authorization header with 401', async () => {
      const res = await request(app).get('/api/profile');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should accept valid Bearer token and return/create profile', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`);
      expect(res.status).toBe(200);
      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.id).toBe(tokenStudentA);
    });

    it('should update profile with valid schema payload', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          display_name: 'Alpha Tester',
          education_level: 'undergraduate',
          field_of_study: 'Computer Science',
          subjects_of_interest: ['Algorithms', 'Machine Learning'],
          current_knowledge_level: 'intermediate',
          learning_goals: ['Pass Advanced Algorithms exam'],
          preferred_language: 'en',
          daily_study_minutes: 40,
        });

      expect(res.status).toBe(200);
      expect(res.body.profile.display_name).toBe('Alpha Tester');
      expect(res.body.profile.is_onboarded).toBe(true);
    });

    it('should reject invalid profile updates with validation error', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          display_name: '', // Empty display name should fail
          education_level: 'invalid_level',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('3. Student Data Isolation & Security', () => {
    let convIdUserA: string;

    beforeAll(async () => {
      const conv = await db.createConversation(tokenStudentA, 'Private Conversation A', 'conceptual');
      convIdUserA = conv.id;
    });

    it('Student B cannot access Student A conversation', async () => {
      const res = await request(app)
        .get(`/api/tutor/conversations/${convIdUserA}`)
        .set('Authorization', `Bearer ${tokenStudentB}`);

      expect(res.status).toBe(404); // Should be hidden/not found
    });

    it('Student B cannot delete Student A conversation', async () => {
      const res = await request(app)
        .delete(`/api/tutor/conversations/${convIdUserA}`)
        .set('Authorization', `Bearer ${tokenStudentB}`);

      expect(res.status).toBe(404);
    });

    it('Student A can access their own conversation', async () => {
      const res = await request(app)
        .get(`/api/tutor/conversations/${convIdUserA}`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.conversation.id).toBe(convIdUserA);
    });
  });

  describe('4. AI Tutor Chat & Conversation Flow', () => {
    it('POST /api/tutor/chat should generate an adaptive educational response', async () => {
      const res = await request(app)
        .post('/api/tutor/chat')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          message: 'What is a binary search tree and when should I use it?',
          tutorMode: 'conceptual',
        });

      expect(res.status).toBe(200);
      expect(res.body.conversationId).toBeDefined();
      expect(res.body.message).toBeDefined();
      expect(res.body.message.content.length).toBeGreaterThan(20);
    });
  });

  describe('5. Learning Paths & Lessons', () => {
    let createdPathId: string;
    let firstLessonId: string;

    it('POST /api/learning-paths/generate should generate and persist a curriculum', async () => {
      const res = await request(app)
        .post('/api/learning-paths/generate')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          subject: 'Python Data Analysis',
          currentKnowledgeLevel: 'beginner',
          learningObjective: 'Learn Pandas and NumPy for tabular data',
          availableHoursPerWeek: 6,
          preferredLessonStyle: 'practical',
        });

      expect(res.status).toBe(201);
      expect(res.body.path.title).toBeDefined();
      expect(res.body.path.modules.length).toBeGreaterThan(0);
      createdPathId = res.body.path.id;
      firstLessonId = res.body.path.modules[0].lessons[0].id;
    });

    it('GET /api/lessons/:id should retrieve the lesson with status', async () => {
      const res = await request(app)
        .get(`/api/lessons/${firstLessonId}`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.lesson.title).toBeDefined();
      expect(res.body.lesson.status).toBe('not_started');
    });

    it('POST /api/lessons/:id/complete should mark lesson completed', async () => {
      const res = await request(app)
        .post(`/api/lessons/${firstLessonId}/complete`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.progress.status).toBe('completed');
    });
  });

  describe('6. AI Quizzes & Deterministic Server Grading', () => {
    let quizId: string;

    it('POST /api/quizzes/generate should generate a quiz without leaking answers to client', async () => {
      const res = await request(app)
        .post('/api/quizzes/generate')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          subject: 'Computer Science',
          topic: 'Recursion',
          difficulty: 'medium',
          questionCount: 3,
          questionType: 'multiple_choice',
        });

      expect(res.status).toBe(201);
      expect(res.body.quiz.id).toBeDefined();
      expect(res.body.quiz.questions.length).toBe(3);

      // Verify anti-cheat: correctAnswer must not be returned in client question list
      for (const q of res.body.quiz.questions) {
        expect(q.correctAnswer).toBeUndefined();
      }

      quizId = res.body.quiz.id;
    });

    it('POST /api/quizzes/:id/submit should evaluate answers on server and return score', async () => {
      // Get internal quiz directly from db to know correct answer
      const internalQuiz = await db.getQuiz(tokenStudentA, quizId);
      expect(internalQuiz).toBeDefined();

      const q1 = internalQuiz!.questions[0];
      const answers = [
        { questionId: q1.id, selectedAnswer: q1.correctAnswer },
      ];

      const res = await request(app)
        .post(`/api/quizzes/${quizId}/submit`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ answers });

      expect(res.status).toBe(200);
      expect(res.body.attempt.score).toBeDefined();
      expect(res.body.attempt.answers.length).toBeGreaterThan(0);
    });
  });

  describe('7. Spaced Repetition & Topic Mastery Logic', () => {
    it('SM-2 algorithm should calculate progressive intervals for easy ratings', () => {
      const result1 = spacedRepetition.calculateNextReview(1, 2.5, 0, 'easy');
      expect(result1.reviewInterval).toBe(1);
      expect(result1.easeFactor).toBeGreaterThanOrEqual(2.5);

      const result2 = spacedRepetition.calculateNextReview(result1.reviewInterval, result1.easeFactor, 1, 'easy');
      expect(result2.reviewInterval).toBe(6);
    });

    it('SM-2 algorithm should reset interval upon hard rating', () => {
      const result = spacedRepetition.calculateNextReview(14, 2.5, 4, 'hard');
      expect(result.reviewInterval).toBe(1);
      expect(result.reviewCount).toBe(0);
    });

    it('Mastery engine should categorize difficulty tiers correctly', () => {
      expect(masteryEngine.getAdaptiveDifficulty(30).tier).toBe('revisit_foundations');
      expect(masteryEngine.getAdaptiveDifficulty(65).tier).toBe('guided_practice');
      expect(masteryEngine.getAdaptiveDifficulty(75).tier).toBe('intermediate_challenge');
      expect(masteryEngine.getAdaptiveDifficulty(90).tier).toBe('advanced_application');
    });
  });

  describe('8. Progress Analytics & Overview', () => {
    it('GET /api/analytics/overview should return metrics computed from real database records', async () => {
      const res = await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.weeklyChartData).toBeDefined();
      expect(res.body.recommendations).toBeDefined();
    });
  });
});
