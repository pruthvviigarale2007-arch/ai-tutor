// ====================================================================
// LearnMate AI - Database Service Layer
// Uses Supabase client when configured, with a resilient local
// repository fallback to ensure seamless local operation & testing.
// ====================================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  UserProfile,
  Conversation,
  Message,
  LearningGoal,
  LearningPath,
  Module,
  Lesson,
  LessonProgress,
  Quiz,
  QuizAttempt,
  TopicMastery,
  StudySession,
  StudyDocument,
  DocumentChunk,
  Flashcard,
} from '../types';

export class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private localDataDir: string;
  private localStoreFile: string;
  private memoryStore: Record<string, any[]> = {};

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase client initialized successfully.');
      } catch (err) {
        console.warn('⚠️ Could not connect to Supabase; utilizing local fallback store:', err);
      }
    } else {
      console.log('ℹ️ Supabase environment variables not configured. Using local persistent storage engine.');
    }

    this.localDataDir = path.resolve(__dirname, '../../data');
    this.localStoreFile = path.join(this.localDataDir, 'store.json');
    this.initLocalStore();
  }

  private initLocalStore() {
    if (!fs.existsSync(this.localDataDir)) {
      fs.mkdirSync(this.localDataDir, { recursive: true });
    }

    if (fs.existsSync(this.localStoreFile)) {
      try {
        const raw = fs.readFileSync(this.localStoreFile, 'utf-8');
        this.memoryStore = JSON.parse(raw);
      } catch {
        this.memoryStore = {};
      }
    }

    const tables = [
      'profiles',
      'learning_goals',
      'conversations',
      'messages',
      'learning_paths',
      'modules',
      'lessons',
      'lesson_progress',
      'quizzes',
      'quiz_attempts',
      'topic_mastery',
      'study_sessions',
      'study_documents',
      'document_chunks',
      'flashcards',
    ];

    for (const t of tables) {
      if (!this.memoryStore[t]) {
        this.memoryStore[t] = [];
      }
    }
    this.persistLocalStore();
  }

  private persistLocalStore() {
    try {
      fs.writeFileSync(this.localStoreFile, JSON.stringify(this.memoryStore, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist local store:', err);
    }
  }

  // ----------------------------------------------------
  // PROFILE & ONBOARDING
  // ----------------------------------------------------
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) return data as UserProfile;
    }

    const found = this.memoryStore.profiles.find((p) => p.id === userId);
    return found || null;
  }

  async upsertProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const now = new Date().toISOString();
    const updatedRecord: UserProfile = {
      id: userId,
      display_name: profileData.display_name || 'Student',
      education_level: profileData.education_level || 'undergraduate',
      field_of_study: profileData.field_of_study || '',
      subjects_of_interest: profileData.subjects_of_interest || [],
      current_knowledge_level: profileData.current_knowledge_level || 'intermediate',
      learning_goals: profileData.learning_goals || [],
      preferred_language: profileData.preferred_language || 'en',
      daily_study_minutes: profileData.daily_study_minutes || 30,
      target_completion_date: profileData.target_completion_date,
      difficult_topics: profileData.difficult_topics || [],
      learning_preferences: profileData.learning_preferences || {
        explanation_style: 'balanced',
        preferred_mode: 'conceptual',
        pace: 'moderate',
      },
      is_onboarded: true,
      created_at: now,
      updated_at: now,
      ...profileData,
    };

    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('profiles')
        .upsert(updatedRecord)
        .select()
        .single();
      if (!error && data) return data as UserProfile;
    }

    const idx = this.memoryStore.profiles.findIndex((p) => p.id === userId);
    if (idx >= 0) {
      this.memoryStore.profiles[idx] = {
        ...this.memoryStore.profiles[idx],
        ...updatedRecord,
        updated_at: now,
      };
      this.persistLocalStore();
      return this.memoryStore.profiles[idx];
    } else {
      this.memoryStore.profiles.push(updatedRecord);
      this.persistLocalStore();
      return updatedRecord;
    }
  }

  // ----------------------------------------------------
  // CONVERSATIONS & MESSAGES
  // ----------------------------------------------------
  async getConversations(userId: string): Promise<Conversation[]> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (!error && data) return data as Conversation[];
    }

    return this.memoryStore.conversations
      .filter((c) => c.user_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  async getConversation(userId: string, conversationId: string): Promise<Conversation | null> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();
      if (!error && data) return data as Conversation;
    }

    const conv = this.memoryStore.conversations.find(
      (c) => c.id === conversationId && c.user_id === userId
    );
    return conv || null;
  }

  async createConversation(userId: string, title: string, tutorMode: any): Promise<Conversation> {
    const conv: Conversation = {
      id: uuidv4(),
      user_id: userId,
      title: title || 'New Conversation',
      tutor_mode: tutorMode || 'conceptual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('conversations')
        .insert(conv)
        .select()
        .single();
      if (!error && data) return data as Conversation;
    }

    this.memoryStore.conversations.unshift(conv);
    this.persistLocalStore();
    return conv;
  }

  async updateConversation(
    userId: string,
    conversationId: string,
    updates: Partial<Conversation>
  ): Promise<Conversation | null> {
    const now = new Date().toISOString();
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('conversations')
        .update({ ...updates, updated_at: now })
        .eq('id', conversationId)
        .eq('user_id', userId)
        .select()
        .single();
      if (!error && data) return data as Conversation;
    }

    const idx = this.memoryStore.conversations.findIndex(
      (c) => c.id === conversationId && c.user_id === userId
    );
    if (idx >= 0) {
      this.memoryStore.conversations[idx] = {
        ...this.memoryStore.conversations[idx],
        ...updates,
        updated_at: now,
      };
      this.persistLocalStore();
      return this.memoryStore.conversations[idx];
    }
    return null;
  }

  async deleteConversation(userId: string, conversationId: string): Promise<boolean> {
    if (this.supabase) {
      const { error } = await this.supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);
      if (!error) return true;
    }

    const initialLen = this.memoryStore.conversations.length;
    this.memoryStore.conversations = this.memoryStore.conversations.filter(
      (c) => !(c.id === conversationId && c.user_id === userId)
    );
    this.memoryStore.messages = this.memoryStore.messages.filter(
      (m) => m.conversation_id !== conversationId
    );
    this.persistLocalStore();
    return this.memoryStore.conversations.length < initialLen;
  }

  async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);
      if (!error && data) return data as Message[];
    }

    return this.memoryStore.messages
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-limit);
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata: any = {}
  ): Promise<Message> {
    const msg: Message = {
      id: uuidv4(),
      conversation_id: conversationId,
      role,
      content,
      metadata,
      created_at: new Date().toISOString(),
    };

    if (this.supabase) {
      const { data, error } = await this.supabase.from('messages').insert(msg).select().single();
      if (!error && data) return data as Message;
    }

    this.memoryStore.messages.push(msg);
    this.persistLocalStore();
    return msg;
  }

  // ----------------------------------------------------
  // LEARNING PATHS, MODULES & LESSONS
  // ----------------------------------------------------
  async getLearningPaths(userId: string): Promise<LearningPath[]> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('learning_paths')
        .select('*, modules(*, lessons(*))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data as LearningPath[];
    }

    const paths = this.memoryStore.learning_paths.filter((p) => p.user_id === userId);
    return paths.map((p) => {
      const modules = this.memoryStore.modules
        .filter((m) => m.learning_path_id === p.id)
        .sort((a, b) => a.position - b.position)
        .map((m) => {
          const lessons = this.memoryStore.lessons
            .filter((l) => l.module_id === m.id)
            .sort((a, b) => a.position - b.position)
            .map((l) => {
              const prog = this.memoryStore.lesson_progress.find(
                (lp) => lp.lesson_id === l.id && lp.user_id === userId
              );
              return {
                ...l,
                status: prog ? prog.status : 'not_started',
                completed_at: prog?.completed_at,
              };
            });
          return { ...m, lessons };
        });
      return { ...p, modules };
    });
  }

  async getLearningPath(userId: string, pathId: string): Promise<LearningPath | null> {
    const paths = await this.getLearningPaths(userId);
    return paths.find((p) => p.id === pathId) || null;
  }

  async createLearningPath(
    userId: string,
    pathData: Omit<LearningPath, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    modulesData: Array<{
      title: string;
      description: string;
      position: number;
      lessons: Array<{
        title: string;
        content: any;
        estimated_minutes: number;
        position: number;
      }>;
    }>
  ): Promise<LearningPath> {
    const pathId = uuidv4();
    const now = new Date().toISOString();

    const newPath: LearningPath = {
      id: pathId,
      user_id: userId,
      title: pathData.title,
      description: pathData.description,
      subject: pathData.subject,
      difficulty: pathData.difficulty,
      target_date: pathData.target_date,
      status: 'in_progress',
      prerequisites: pathData.prerequisites || [],
      created_at: now,
      updated_at: now,
    };

    const modules: Module[] = [];

    for (const m of modulesData) {
      const moduleId = uuidv4();
      const lessons: Lesson[] = [];

      for (const l of m.lessons) {
        const lessonId = uuidv4();
        const lesson: Lesson = {
          id: lessonId,
          module_id: moduleId,
          title: l.title,
          content: l.content,
          estimated_minutes: l.estimated_minutes || 20,
          position: l.position,
          created_at: now,
        };
        lessons.push(lesson);
        this.memoryStore.lessons.push(lesson);
      }

      const mod: Module = {
        id: moduleId,
        learning_path_id: pathId,
        title: m.title,
        description: m.description,
        position: m.position,
        lessons,
        created_at: now,
      };
      modules.push(mod);
      this.memoryStore.modules.push(mod);
    }

    newPath.modules = modules;
    this.memoryStore.learning_paths.unshift(newPath);
    this.persistLocalStore();

    if (this.supabase) {
      try {
        await this.supabase.from('learning_paths').insert({
          id: newPath.id,
          user_id: newPath.user_id,
          title: newPath.title,
          description: newPath.description,
          subject: newPath.subject,
          difficulty: newPath.difficulty,
          status: newPath.status,
          prerequisites: newPath.prerequisites,
        });

        for (const m of modules) {
          await this.supabase.from('modules').insert({
            id: m.id,
            learning_path_id: pathId,
            title: m.title,
            description: m.description,
            position: m.position,
          });

          if (m.lessons) {
            for (const l of m.lessons) {
              await this.supabase.from('lessons').insert({
                id: l.id,
                module_id: m.id,
                title: l.title,
                content: l.content,
                estimated_minutes: l.estimated_minutes,
                position: l.position,
              });
            }
          }
        }
      } catch (err) {
        console.warn('Supabase sync warning for learning path:', err);
      }
    }

    return newPath;
  }

  async deleteLearningPath(userId: string, pathId: string): Promise<boolean> {
    if (this.supabase) {
      await this.supabase.from('learning_paths').delete().eq('id', pathId).eq('user_id', userId);
    }

    const path = this.memoryStore.learning_paths.find((p) => p.id === pathId && p.user_id === userId);
    if (!path) return false;

    const moduleIds = this.memoryStore.modules
      .filter((m) => m.learning_path_id === pathId)
      .map((m) => m.id);

    this.memoryStore.lessons = this.memoryStore.lessons.filter((l) => !moduleIds.includes(l.module_id));
    this.memoryStore.modules = this.memoryStore.modules.filter((m) => m.learning_path_id !== pathId);
    this.memoryStore.learning_paths = this.memoryStore.learning_paths.filter((p) => p.id !== pathId);
    this.persistLocalStore();
    return true;
  }

  async getLesson(userId: string, lessonId: string): Promise<Lesson | null> {
    const lesson = this.memoryStore.lessons.find((l) => l.id === lessonId);
    if (!lesson) return null;

    const progress = this.memoryStore.lesson_progress.find(
      (lp) => lp.lesson_id === lessonId && lp.user_id === userId
    );

    return {
      ...lesson,
      status: progress ? progress.status : 'not_started',
      completed_at: progress?.completed_at,
    };
  }

  async updateLessonProgress(
    userId: string,
    lessonId: string,
    status: 'not_started' | 'in_progress' | 'completed'
  ): Promise<LessonProgress> {
    const now = new Date().toISOString();
    const existingIdx = this.memoryStore.lesson_progress.findIndex(
      (lp) => lp.lesson_id === lessonId && lp.user_id === userId
    );

    let rec: LessonProgress;
    if (existingIdx >= 0) {
      rec = {
        ...this.memoryStore.lesson_progress[existingIdx],
        status,
        completed_at: status === 'completed' ? now : undefined,
        updated_at: now,
      };
      this.memoryStore.lesson_progress[existingIdx] = rec;
    } else {
      rec = {
        id: uuidv4(),
        user_id: userId,
        lesson_id: lessonId,
        status,
        completed_at: status === 'completed' ? now : undefined,
        updated_at: now,
      };
      this.memoryStore.lesson_progress.push(rec);
    }

    this.persistLocalStore();

    if (this.supabase) {
      try {
        await this.supabase.from('lesson_progress').upsert(rec);
      } catch (err) {
        console.warn('Supabase sync warning for lesson progress:', err);
      }
    }

    return rec;
  }

  // ----------------------------------------------------
  // QUIZZES & ATTEMPTS
  // ----------------------------------------------------
  async saveQuiz(quizData: Omit<Quiz, 'id' | 'created_at'>): Promise<Quiz> {
    const quiz: Quiz = {
      id: uuidv4(),
      ...quizData,
      created_at: new Date().toISOString(),
    };

    this.memoryStore.quizzes.unshift(quiz);
    this.persistLocalStore();

    if (this.supabase) {
      try {
        await this.supabase.from('quizzes').insert(quiz);
      } catch (err) {
        console.warn('Supabase quiz insert warning:', err);
      }
    }

    return quiz;
  }

  async getQuiz(userId: string, quizId: string): Promise<Quiz | null> {
    const quiz = this.memoryStore.quizzes.find((q) => q.id === quizId && q.user_id === userId);
    return quiz || null;
  }

  async saveQuizAttempt(attemptData: Omit<QuizAttempt, 'id' | 'completed_at'>): Promise<QuizAttempt> {
    const attempt: QuizAttempt = {
      id: uuidv4(),
      ...attemptData,
      completed_at: new Date().toISOString(),
    };

    this.memoryStore.quiz_attempts.unshift(attempt);
    this.persistLocalStore();

    if (this.supabase) {
      try {
        await this.supabase.from('quiz_attempts').insert(attempt);
      } catch (err) {
        console.warn('Supabase quiz attempt insert warning:', err);
      }
    }

    return attempt;
  }

  async getQuizAttempts(userId: string, quizId?: string): Promise<QuizAttempt[]> {
    let attempts = this.memoryStore.quiz_attempts.filter((a) => a.user_id === userId);
    if (quizId) {
      attempts = attempts.filter((a) => a.quiz_id === quizId);
    }
    return attempts.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
  }

  // ----------------------------------------------------
  // TOPIC MASTERY
  // ----------------------------------------------------
  async getTopicMastery(userId: string): Promise<TopicMastery[]> {
    return this.memoryStore.topic_mastery
      .filter((m) => m.user_id === userId)
      .sort((a, b) => b.mastery_score - a.mastery_score);
  }

  async updateTopicMastery(
    userId: string,
    topic: string,
    isCorrect: boolean
  ): Promise<TopicMastery> {
    const now = new Date().toISOString();
    let record = this.memoryStore.topic_mastery.find(
      (m) => m.user_id === userId && m.topic.toLowerCase() === topic.toLowerCase()
    );

    if (!record) {
      record = {
        id: uuidv4(),
        user_id: userId,
        topic,
        mastery_score: isCorrect ? 40 : 15,
        confidence: 'low',
        total_attempts: 1,
        correct_attempts: isCorrect ? 1 : 0,
        last_assessed_at: now,
        updated_at: now,
      };
      this.memoryStore.topic_mastery.push(record);
    } else {
      record.total_attempts += 1;
      if (isCorrect) record.correct_attempts += 1;

      // Transparent explainable weighted mastery formula
      const rawAccuracy = (record.correct_attempts / record.total_attempts) * 100;
      // Exponential moving average trend adjustment: weight recent result 25%
      const impact = isCorrect ? +12 : -8;
      record.mastery_score = Math.min(100, Math.max(0, Math.round(rawAccuracy * 0.7 + (record.mastery_score + impact) * 0.3)));
      
      if (record.total_attempts >= 5 && record.mastery_score >= 80) {
        record.confidence = 'high';
      } else if (record.total_attempts >= 3) {
        record.confidence = 'medium';
      } else {
        record.confidence = 'low';
      }

      record.last_assessed_at = now;
      record.updated_at = now;
    }

    this.persistLocalStore();

    if (this.supabase) {
      try {
        await this.supabase.from('topic_mastery').upsert(record);
      } catch (err) {
        console.warn('Supabase topic mastery warning:', err);
      }
    }

    return record;
  }

  // ----------------------------------------------------
  // STUDY SESSIONS / PLANNER
  // ----------------------------------------------------
  async getStudySessions(userId: string): Promise<StudySession[]> {
    return this.memoryStore.study_sessions
      .filter((s) => s.user_id === userId)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }

  async createStudySession(userId: string, sessionData: Omit<StudySession, 'id' | 'user_id' | 'created_at'>): Promise<StudySession> {
    const session: StudySession = {
      id: uuidv4(),
      user_id: userId,
      ...sessionData,
      created_at: new Date().toISOString(),
    };

    this.memoryStore.study_sessions.push(session);
    this.persistLocalStore();
    return session;
  }

  async updateStudySession(
    userId: string,
    sessionId: string,
    updates: Partial<StudySession>
  ): Promise<StudySession | null> {
    const idx = this.memoryStore.study_sessions.findIndex(
      (s) => s.id === sessionId && s.user_id === userId
    );
    if (idx >= 0) {
      this.memoryStore.study_sessions[idx] = {
        ...this.memoryStore.study_sessions[idx],
        ...updates,
      };
      this.persistLocalStore();
      return this.memoryStore.study_sessions[idx];
    }
    return null;
  }

  async deleteStudySession(userId: string, sessionId: string): Promise<boolean> {
    const prev = this.memoryStore.study_sessions.length;
    this.memoryStore.study_sessions = this.memoryStore.study_sessions.filter(
      (s) => !(s.id === sessionId && s.user_id === userId)
    );
    this.persistLocalStore();
    return this.memoryStore.study_sessions.length < prev;
  }

  // ----------------------------------------------------
  // STUDY MATERIALS & RAG
  // ----------------------------------------------------
  async getStudyDocuments(userId: string): Promise<StudyDocument[]> {
    return this.memoryStore.study_documents
      .filter((d) => d.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getStudyDocument(userId: string, docId: string): Promise<StudyDocument | null> {
    return this.memoryStore.study_documents.find(
      (d) => d.id === docId && d.user_id === userId
    ) || null;
  }

  async createStudyDocument(
    userId: string,
    docData: Omit<StudyDocument, 'id' | 'user_id' | 'created_at'>
  ): Promise<StudyDocument> {
    const doc: StudyDocument = {
      id: uuidv4(),
      user_id: userId,
      ...docData,
      created_at: new Date().toISOString(),
    };
    this.memoryStore.study_documents.unshift(doc);
    this.persistLocalStore();
    return doc;
  }

  async updateStudyDocument(
    userId: string,
    docId: string,
    updates: Partial<StudyDocument>
  ): Promise<StudyDocument | null> {
    const idx = this.memoryStore.study_documents.findIndex(
      (d) => d.id === docId && d.user_id === userId
    );
    if (idx >= 0) {
      this.memoryStore.study_documents[idx] = {
        ...this.memoryStore.study_documents[idx],
        ...updates,
      };
      this.persistLocalStore();
      return this.memoryStore.study_documents[idx];
    }
    return null;
  }

  async deleteStudyDocument(userId: string, docId: string): Promise<boolean> {
    const doc = this.memoryStore.study_documents.find(
      (d) => d.id === docId && d.user_id === userId
    );
    if (!doc) return false;

    this.memoryStore.study_documents = this.memoryStore.study_documents.filter((d) => d.id !== docId);
    this.memoryStore.document_chunks = this.memoryStore.document_chunks.filter((c) => c.document_id !== docId);
    this.persistLocalStore();
    return true;
  }

  async saveDocumentChunks(chunks: Array<Omit<DocumentChunk, 'id' | 'created_at'>>): Promise<void> {
    const now = new Date().toISOString();
    for (const c of chunks) {
      this.memoryStore.document_chunks.push({
        id: uuidv4(),
        ...c,
        created_at: now,
      });
    }
    this.persistLocalStore();
  }

  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    return this.memoryStore.document_chunks
      .filter((c) => c.document_id === documentId)
      .sort((a, b) => a.chunk_index - b.chunk_index);
  }

  // ----------------------------------------------------
  // FLASHCARDS
  // ----------------------------------------------------
  async getFlashcards(userId: string): Promise<Flashcard[]> {
    return this.memoryStore.flashcards
      .filter((f) => f.user_id === userId)
      .sort((a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime());
  }

  async saveFlashcards(cards: Array<Omit<Flashcard, 'id' | 'created_at'>>): Promise<Flashcard[]> {
    const created: Flashcard[] = [];
    const now = new Date().toISOString();
    for (const c of cards) {
      const card: Flashcard = {
        id: uuidv4(),
        ...c,
        created_at: now,
      };
      this.memoryStore.flashcards.unshift(card);
      created.push(card);
    }
    this.persistLocalStore();
    return created;
  }

  async updateFlashcardReview(
    userId: string,
    cardId: string,
    reviewResult: { next_review_at: string; review_interval: number; ease_factor: number; review_count: number }
  ): Promise<Flashcard | null> {
    const idx = this.memoryStore.flashcards.findIndex(
      (f) => f.id === cardId && f.user_id === userId
    );
    if (idx >= 0) {
      this.memoryStore.flashcards[idx] = {
        ...this.memoryStore.flashcards[idx],
        ...reviewResult,
      };
      this.persistLocalStore();
      return this.memoryStore.flashcards[idx];
    }
    return null;
  }

  async deleteFlashcard(userId: string, cardId: string): Promise<boolean> {
    const prev = this.memoryStore.flashcards.length;
    this.memoryStore.flashcards = this.memoryStore.flashcards.filter(
      (f) => !(f.id === cardId && f.user_id === userId)
    );
    this.persistLocalStore();
    return this.memoryStore.flashcards.length < prev;
  }
}

export const db = new DatabaseService();
