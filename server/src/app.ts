// ====================================================================
// LearnMate AI - Main Express Application Server
// ====================================================================
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

import authRoutes from './routes/auth';
import tutorRoutes from './routes/tutor';
import learningPathsRoutes from './routes/learningPaths';
import lessonsRoutes from './routes/lessons';
import quizzesRoutes from './routes/quizzes';
import documentsRoutes from './routes/documents';
import flashcardsRoutes from './routes/flashcards';
import plannerRoutes from './routes/planner';
import analyticsRoutes from './routes/analytics';
import { errorHandler } from './middleware/errorHandler';
import { ai } from './services/ai';

const app = express();
const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. CORS Configuration (Allows client origin & credentials)
app.use(
  cors({
    origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 2. Body Parsers with safe payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      openAiLive: ai.isLiveOpenAI(),
      openAiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      supabaseConfigured: Boolean(process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project')),
    },
  });
});

// 4. Mount API Routes
app.use('/api', authRoutes);
app.use('/api', tutorRoutes);
app.use('/api', learningPathsRoutes);
app.use('/api', lessonsRoutes);
app.use('/api', quizzesRoutes);
app.use('/api', documentsRoutes);
app.use('/api', flashcardsRoutes);
app.use('/api', plannerRoutes);
app.use('/api', analyticsRoutes);

// 5. 404 Route Handler
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API endpoint ${req.method} ${req.originalUrl} does not exist.`,
  });
});

// 6. Global Error Handler
app.use(errorHandler);

// 7. Start Server if executed directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`🚀 LearnMate AI Server running on port ${port}`);
    console.log(`🔗 Health check available at: http://localhost:${port}/api/health`);
  });
}

export default app;
