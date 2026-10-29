// ====================================================================
// LearnMate AI - AI Tutor Chat & Conversation Routes
// ====================================================================
import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { db } from '../services/db';
import { ai } from '../services/ai';
import { rag } from '../services/rag';
import { TutorChatSchema } from '../schemas/validation';
import { TutorMode } from '../types';

const router = Router();

// GET /api/tutor/conversations
router.get('/tutor/conversations', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversations = await db.getConversations(userId);
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
});

// GET /api/tutor/conversations/:id
router.get('/tutor/conversations/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const convId = req.params.id;

    const conversation = await db.getConversation(userId, convId);
    if (!conversation) {
      res.status(404).json({ error: 'Not Found', message: 'Conversation not found or access denied.' });
      return;
    }

    const messages = await db.getMessages(convId, 60);
    res.json({ conversation, messages });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tutor/conversations/:id
router.delete('/tutor/conversations/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const convId = req.params.id;

    const success = await db.deleteConversation(userId, convId);
    if (!success) {
      res.status(404).json({ error: 'Not Found', message: 'Conversation not found or access denied.' });
      return;
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/tutor/chat
router.post('/tutor/chat', requireAuth, rateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = TutorChatSchema.parse(req.body);
    const isStream = req.query.stream === 'true' || req.headers.accept === 'text/event-stream';

    // 1. Get or create conversation
    let convId = validated.conversationId;
    let conversation;

    if (convId) {
      conversation = await db.getConversation(userId, convId);
      if (!conversation) {
        res.status(404).json({ error: 'Not Found', message: 'Target conversation does not exist or access denied.' });
        return;
      }
      // Update tutor mode if requested
      if (validated.tutorMode && validated.tutorMode !== conversation.tutor_mode) {
        conversation = await db.updateConversation(userId, convId, { tutor_mode: validated.tutorMode as TutorMode });
      }
    } else {
      // Derive smart title from first 35 chars of user message
      const title = validated.message.length > 35 ? validated.message.slice(0, 32) + '...' : validated.message;
      conversation = await db.createConversation(userId, title, validated.tutorMode as TutorMode);
      convId = conversation.id;
    }

    // 2. Fetch student profile context
    const profile = await db.getProfile(userId);

    // 3. Check for document grounding (RAG)
    let retrievedContext: string | undefined;
    let sources: Array<{ docId: string; filename: string; page?: number }> = [];

    if (validated.documentId) {
      const doc = await db.getStudyDocument(userId, validated.documentId);
      if (doc) {
        const passages = await rag.retrieveRelevantChunks(doc.id, validated.message, 3);
        if (passages.length > 0) {
          retrievedContext = passages
            .map((p) => `[Source: ${doc.filename}${p.pageNumber ? ` p.${p.pageNumber}` : ''}]:\n${p.chunkText}`)
            .join('\n\n---\n\n');
          sources = passages.map((p) => ({
            docId: doc.id,
            filename: doc.filename,
            page: p.pageNumber,
          }));
        }
      }
    }

    // 4. Save user message in conversation
    await db.addMessage(convId, 'user', validated.message);

    // 5. Retrieve past message history (limit to last 10 messages for token efficiency & cost control)
    const history = await db.getMessages(convId, 10);
    const chatParams = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 6. Handle Streaming vs Standard Response
    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      let assistantResponse = '';
      try {
        assistantResponse = await ai.chatStream(
          chatParams,
          profile || undefined,
          (conversation?.tutor_mode as TutorMode) || 'conceptual',
          retrievedContext,
          (chunk) => {
            res.write(`data: ${JSON.stringify({ chunk, conversationId: convId })}\n\n`);
          }
        );

        // Save assistant message to database
        const savedMsg = await db.addMessage(convId, 'assistant', assistantResponse, {
          tutor_mode: conversation?.tutor_mode,
          sources: sources.length > 0 ? sources : undefined,
        });

        res.write(`data: ${JSON.stringify({ done: true, messageId: savedMsg.id, fullContent: assistantResponse })}\n\n`);
        res.end();
      } catch (err: any) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      }
    } else {
      // Standard JSON response
      let assistantResponse = '';
      assistantResponse = await ai.chatStream(
        chatParams,
        profile || undefined,
        (conversation?.tutor_mode as TutorMode) || 'conceptual',
        retrievedContext,
        () => {}
      );

      const savedMsg = await db.addMessage(convId, 'assistant', assistantResponse, {
        tutor_mode: conversation?.tutor_mode,
        sources: sources.length > 0 ? sources : undefined,
      });

      res.json({
        conversationId: convId,
        message: savedMsg,
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
