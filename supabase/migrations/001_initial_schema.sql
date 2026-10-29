-- ====================================================================
-- LearnMate AI - Initial PostgreSQL Schema & Row Level Security (RLS)
-- Migration: 001_initial_schema.sql
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Enable pgvector if available on the Supabase instance
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "vector";
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pgvector extension not enabled or unsupported on this host; falling back to jsonb/array storage for embeddings';
END $$;

-- 2. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  education_level TEXT DEFAULT 'undergraduate',
  field_of_study TEXT DEFAULT '',
  subjects_of_interest TEXT[] DEFAULT '{}',
  current_knowledge_level TEXT DEFAULT 'intermediate',
  learning_goals TEXT[] DEFAULT '{}',
  preferred_language TEXT DEFAULT 'en',
  daily_study_minutes INTEGER DEFAULT 30 CHECK (daily_study_minutes > 0),
  target_completion_date DATE,
  difficult_topics TEXT[] DEFAULT '{}',
  learning_preferences JSONB DEFAULT '{"explanation_style": "balanced", "preferred_mode": "conceptual", "pace": "moderate"}'::jsonb,
  is_onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. LEARNING GOALS
CREATE TABLE IF NOT EXISTS public.learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_learning_goals_user ON public.learning_goals(user_id);

-- 5. CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  tutor_mode TEXT NOT NULL DEFAULT 'conceptual' CHECK (tutor_mode IN ('beginner', 'conceptual', 'exam_prep', 'socratic', 'practical', 'revision')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);

CREATE TRIGGER update_conversations_modtime
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- 7. LEARNING PATHS
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'intermediate',
  target_date DATE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
  prerequisites TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_learning_paths_user ON public.learning_paths(user_id);

-- 8. MODULES
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_modules_path ON public.modules(learning_path_id, position);

-- 9. LESSONS
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  estimated_minutes INTEGER DEFAULT 20 CHECK (estimated_minutes > 0),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.lessons(module_id, position);

-- 10. LESSON PROGRESS
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id, status);

-- 11. QUIZZES
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  questions JSONB NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'intermediate',
  time_limit_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quizzes_user ON public.quizzes(user_id);

-- 12. QUIZ ATTEMPTS
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);

-- 13. TOPIC MASTERY
CREATE TABLE IF NOT EXISTS public.topic_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  mastery_score INTEGER NOT NULL DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  last_assessed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic)
);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_user ON public.topic_mastery(user_id);

-- 14. STUDY SESSIONS
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  planned_minutes INTEGER NOT NULL DEFAULT 30,
  actual_minutes INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'missed', 'rescheduled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON public.study_sessions(user_id, scheduled_at);

-- 15. STUDY DOCUMENTS
CREATE TABLE IF NOT EXISTS public.study_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  file_type TEXT DEFAULT 'application/pdf',
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  summary TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_study_documents_user ON public.study_documents(user_id);

-- 16. DOCUMENT CHUNKS
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.study_documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  page_number INTEGER,
  token_count INTEGER,
  embedding_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON public.document_chunks(document_id, chunk_index);

-- 17. FLASHCARDS
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  review_interval INTEGER DEFAULT 1,
  ease_factor NUMERIC(4,2) DEFAULT 2.50,
  review_count INTEGER DEFAULT 0,
  source_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_flashcards_user ON public.flashcards(user_id, next_review_at);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: No user may read or modify another user's records.
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Profiles: Only owner can view or edit
CREATE POLICY "profiles_owner_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_owner_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_owner_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Learning Goals
CREATE POLICY "goals_owner_all" ON public.learning_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Conversations
CREATE POLICY "conversations_owner_all" ON public.conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Messages (via conversation ownership)
CREATE POLICY "messages_owner_select" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations WHERE id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "messages_owner_insert" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.conversations WHERE id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "messages_owner_delete" ON public.messages FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.conversations WHERE id = messages.conversation_id AND user_id = auth.uid())
);

-- Learning Paths
CREATE POLICY "learning_paths_owner_all" ON public.learning_paths FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Modules & Lessons (via learning path ownership)
CREATE POLICY "modules_owner_all" ON public.modules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.learning_paths WHERE id = modules.learning_path_id AND user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.learning_paths WHERE id = modules.learning_path_id AND user_id = auth.uid())
);

CREATE POLICY "lessons_owner_all" ON public.lessons FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.modules
    JOIN public.learning_paths ON learning_paths.id = modules.learning_path_id
    WHERE modules.id = lessons.module_id AND learning_paths.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.modules
    JOIN public.learning_paths ON learning_paths.id = modules.learning_path_id
    WHERE modules.id = lessons.module_id AND learning_paths.user_id = auth.uid()
  )
);

-- Lesson Progress
CREATE POLICY "lesson_progress_owner_all" ON public.lesson_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Quizzes
CREATE POLICY "quizzes_owner_all" ON public.quizzes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Quiz Attempts
CREATE POLICY "quiz_attempts_owner_all" ON public.quiz_attempts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Topic Mastery
CREATE POLICY "topic_mastery_owner_all" ON public.topic_mastery FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Study Sessions
CREATE POLICY "study_sessions_owner_all" ON public.study_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Study Documents
CREATE POLICY "study_documents_owner_all" ON public.study_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Document Chunks (via study document ownership)
CREATE POLICY "document_chunks_owner_all" ON public.document_chunks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.study_documents WHERE id = document_chunks.document_id AND user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.study_documents WHERE id = document_chunks.document_id AND user_id = auth.uid())
);

-- Flashcards
CREATE POLICY "flashcards_owner_all" ON public.flashcards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
