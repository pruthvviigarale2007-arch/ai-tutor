// ====================================================================
// LearnMate AI - Study Materials & Document RAG Routes
// ====================================================================
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { db } from '../services/db';
import { rag } from '../services/rag';
import { ai } from '../services/ai';
import { DocumentAskSchema } from '../schemas/validation';

const router = Router();

// Multer upload directory
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload PDF, TXT, or Markdown documents.'));
    }
  },
});

// GET /api/documents
router.get('/documents', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const documents = await db.getStudyDocuments(userId);
    res.json({ documents });
  } catch (err) {
    next(err);
  }
});

// POST /api/documents/upload
router.post(
  '/documents/upload',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'Bad Request', message: 'No file was provided for upload.' });
        return;
      }

      // 1. Create document record
      const doc = await db.createStudyDocument(userId, {
        filename: file.originalname,
        storage_path: file.path,
        file_size: file.size,
        file_type: file.mimetype || 'application/octet-stream',
        processing_status: 'processing',
        chunk_count: 0,
      });

      // 2. Extract, chunk, embed, and index asynchronously or inline
      try {
        const chunkCount = await rag.processAndIndexDocument(doc.id, file.path, file.mimetype);
        doc.processing_status = 'completed';
        doc.chunk_count = chunkCount;
      } catch (err: any) {
        console.error('Document indexing failed:', err);
        await db.updateStudyDocument(userId, doc.id, { processing_status: 'failed' });
        doc.processing_status = 'failed';
      }

      res.status(201).json({
        message: 'Document uploaded and indexed successfully',
        document: doc,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/documents/:id/ask (Grounded RAG Q&A with citations)
router.post('/documents/:id/ask', requireAuth, rateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const docId = req.params.id;
    const { question } = DocumentAskSchema.parse(req.body);

    const doc = await db.getStudyDocument(userId, docId);
    if (!doc) {
      res.status(404).json({ error: 'Not Found', message: 'Study document not found or access denied.' });
      return;
    }

    // Retrieve top relevant passages
    const passages = await rag.retrieveRelevantChunks(docId, question, 4);

    let answer = '';
    const citations = passages.map((p) => ({
      chunkIndex: p.chunkIndex,
      pageNumber: p.pageNumber,
      snippet: p.chunkText.slice(0, 140) + '...',
      similarity: Number(p.similarity.toFixed(3)),
    }));

    if (passages.length === 0) {
      answer = `I examined "${doc.filename}", but could not find relevant sections directly addressing: "${question}".`;
    } else {
      const retrievedContext = passages
        .map((p) => `[Page ${p.pageNumber || 'N/A'}, Excerpt]: ${p.chunkText}`)
        .join('\n\n');

      const profile = await db.getProfile(userId);
      answer = await ai.chatStream(
        [{ role: 'user', content: question }],
        profile || undefined,
        'conceptual',
        retrievedContext,
        () => {}
      );
    }

    res.json({
      question,
      answer,
      documentName: doc.filename,
      citations,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/documents/:id/summarize
router.post('/documents/:id/summarize', requireAuth, rateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const docId = req.params.id;

    const doc = await db.getStudyDocument(userId, docId);
    if (!doc) {
      res.status(404).json({ error: 'Not Found', message: 'Study document not found or access denied.' });
      return;
    }

    const chunks = await db.getDocumentChunks(docId);
    const combinedText = chunks.slice(0, 8).map((c) => c.chunk_text).join('\n\n');

    const summaryPrompt = `Provide a comprehensive educational summary of the following document content.
Outline:
1. Executive Summary & Purpose
2. Core Themes & Definitions
3. Key Principles & Formulas
4. Suggested Revision Questions

Content:
${combinedText.slice(0, 4000)}`;

    const summary = await ai.chatStream(
      [{ role: 'user', content: summaryPrompt }],
      undefined,
      'revision',
      undefined,
      () => {}
    );

    await db.updateStudyDocument(userId, docId, { summary });

    res.json({
      documentId: docId,
      filename: doc.filename,
      summary,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id
router.delete('/documents/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const docId = req.params.id;

    const doc = await db.getStudyDocument(userId, docId);
    if (!doc) {
      res.status(404).json({ error: 'Not Found', message: 'Study document not found or access denied.' });
      return;
    }

    // Remove file from disk if present
    if (fs.existsSync(doc.storage_path)) {
      try {
        fs.unlinkSync(doc.storage_path);
      } catch (err) {
        console.warn('Could not delete physical upload file:', err);
      }
    }

    await db.deleteStudyDocument(userId, docId);

    res.json({ message: 'Study material deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
