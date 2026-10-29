// ==========================================
// LearnMate AI - Zod Request Validation Schemas
// ==========================================
import { z } from 'zod';

export const ProfileUpdateSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').max(100),
  education_level: z.enum([
    'middle_school',
    'high_school',
    'undergraduate',
    'postgraduate',
    'professional_lifelong',
  ]),
  field_of_study: z.string().max(100).optional().default(''),
  subjects_of_interest: z.array(z.string()).default([]),
  current_knowledge_level: z.enum(['beginner', 'intermediate', 'advanced']),
  learning_goals: z.array(z.string()).default([]),
  preferred_language: z.string().min(2).max(10).default('en'),
  daily_study_minutes: z.number().int().min(5).max(480).default(30),
  target_completion_date: z.string().optional().nullable(),
  difficult_topics: z.array(z.string()).default([]),
  learning_preferences: z.object({
    explanation_style: z.enum(['simple', 'detailed', 'socratic', 'practical', 'balanced']),
    preferred_mode: z.enum(['beginner', 'conceptual', 'exam_prep', 'socratic', 'practical', 'revision']),
    pace: z.enum(['gentle', 'moderate', 'accelerated']),
  }).optional(),
});

export const TutorChatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(4000),
  tutorMode: z.enum(['beginner', 'conceptual', 'exam_prep', 'socratic', 'practical', 'revision']).default('conceptual'),
  documentId: z.string().uuid().optional(),
});

export const LearningPathGenerateSchema = z.object({
  subject: z.string().min(2, 'Subject must be at least 2 characters').max(100),
  currentKnowledgeLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  learningObjective: z.string().min(5, 'Objective must be at least 5 characters').max(300),
  availableHoursPerWeek: z.number().min(1).max(80).default(5),
  targetDate: z.string().optional(),
  preferredLessonStyle: z.enum(['simple', 'detailed', 'socratic', 'practical', 'balanced']).default('balanced'),
});

export const LessonGenerateSchema = z.object({
  topic: z.string().min(2).max(150),
  educationLevel: z.enum(['middle_school', 'high_school', 'undergraduate', 'postgraduate', 'professional_lifelong']).default('undergraduate'),
  desiredLessonLength: z.enum(['short', 'medium', 'deep_dive']).default('medium'),
  explanationStyle: z.enum(['simple', 'detailed', 'socratic', 'practical', 'balanced']).default('balanced'),
  preferredLanguage: z.string().default('en'),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
});

export const QuizGenerateSchema = z.object({
  subject: z.string().min(2).max(100),
  topic: z.string().min(2).max(150),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  questionCount: z.number().int().min(3).max(15).default(5),
  questionType: z.enum(['multiple_choice', 'true_false', 'short_answer', 'fill_in_the_blanks', 'mixed']).default('multiple_choice'),
  timeLimitMinutes: z.number().int().min(3).max(60).default(10),
  lessonId: z.string().uuid().optional(),
});

export const QuizSubmitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedAnswer: z.string(),
    })
  ).min(1, 'At least one answer must be submitted'),
});

export const FlashcardGenerateSchema = z.object({
  topic: z.string().min(2).max(150),
  count: z.number().int().min(3).max(20).default(8),
  sourceType: z.enum(['topic', 'lesson', 'document', 'quiz']).default('topic'),
  sourceId: z.string().optional(),
});

export const FlashcardReviewSchema = z.object({
  rating: z.enum(['easy', 'medium', 'hard']),
});

export const StudySessionSchema = z.object({
  topic: z.string().min(2).max(150),
  planned_minutes: z.number().int().min(5).max(360).default(30),
  scheduled_at: z.string(),
  notes: z.string().max(500).optional(),
});

export const DocumentAskSchema = z.object({
  question: z.string().min(3).max(2000),
});
