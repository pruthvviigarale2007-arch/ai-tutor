// ==========================================
// LearnMate AI - Client Type Definitions
// ==========================================

export type TutorMode =
  | 'beginner'
  | 'conceptual'
  | 'exam_prep'
  | 'socratic'
  | 'practical'
  | 'revision';

export type EducationLevel =
  | 'middle_school'
  | 'high_school'
  | 'undergraduate'
  | 'postgraduate'
  | 'professional_lifelong';

export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  id: string;
  display_name: string;
  education_level: EducationLevel;
  field_of_study: string;
  subjects_of_interest: string[];
  current_knowledge_level: KnowledgeLevel;
  learning_goals: string[];
  preferred_language: string;
  daily_study_minutes: number;
  target_completion_date?: string;
  difficult_topics: string[];
  learning_preferences: {
    explanation_style: 'simple' | 'detailed' | 'socratic' | 'practical' | 'balanced';
    preferred_mode: TutorMode;
    pace: 'gentle' | 'moderate' | 'accelerated';
  };
  is_onboarded: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  tutor_mode: TutorMode;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    tutor_mode?: TutorMode;
    sources?: Array<{ docId: string; filename: string; page?: number }>;
    suggestedQuestions?: string[];
  };
  created_at: string;
}

export interface LessonContent {
  overview: string;
  objectives: string[];
  explanation: string;
  examples: Array<{ title: string; explanation: string; codeOrSteps?: string }>;
  keyTerminology: Array<{ term: string; definition: string }>;
  misconceptions: Array<{ misconception: string; clarification: string }>;
  practiceQuestions: Array<{ question: string; hint: string; answer: string }>;
  summary: string;
  furtherStudySuggestions: string[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: LessonContent;
  estimated_minutes: number;
  position: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  completed_at?: string;
  created_at: string;
}

export interface Module {
  id: string;
  learning_path_id: string;
  title: string;
  description: string;
  position: number;
  lessons?: Lesson[];
  created_at: string;
}

export interface LearningPath {
  id: string;
  user_id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  target_date?: string;
  status: 'in_progress' | 'completed' | 'paused';
  prerequisites: string[];
  modules?: Module[];
  created_at: string;
  updated_at: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_in_the_blanks';

export interface QuizClientQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  lesson_id?: string;
  title: string;
  topic: string;
  questions: QuizClientQuestion[];
  difficulty: string;
  time_limit_minutes: number;
  created_at: string;
}

export interface QuizEvaluationResult {
  questionId: string;
  questionText: string;
  type: QuestionType;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  topic: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_count: number;
  answers: QuizEvaluationResult[];
  completed_at: string;
}

export interface TopicMastery {
  id: string;
  user_id: string;
  topic: string;
  mastery_score: number;
  confidence: 'low' | 'medium' | 'high';
  total_attempts: number;
  correct_attempts: number;
  difficultyTier?: string;
  difficultyLabel?: string;
  pedagogicalGuidance?: string;
  last_assessed_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  topic: string;
  planned_minutes: number;
  actual_minutes: number;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'missed' | 'rescheduled';
  notes?: string;
  created_at: string;
}

export interface StudyDocument {
  id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  file_size: number;
  file_type: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  summary?: string;
  chunk_count: number;
  created_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  topic: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  next_review_at: string;
  review_interval: number;
  ease_factor: number;
  review_count: number;
  source_ref?: string;
  created_at: string;
}

export interface Recommendation {
  id: string;
  type: 'revisit_foundations' | 'guided_practice' | 'intermediate_challenge' | 'advanced_application' | 'spaced_revision';
  topic: string;
  headline: string;
  reason: string;
  targetAction: string;
  priority: 'high' | 'medium' | 'low';
  currentMastery: number;
}
