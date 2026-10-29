// ====================================================================
// LearnMate AI - Retrieval-Augmented Generation (RAG) Service
// Handles file text extraction (PDF, TXT, MD), semantic chunking,
// embedding generation, vector similarity search, and grounding.
// ====================================================================
import pdfParse from 'pdf-parse';
import fs from 'fs';
import { ai } from './ai';
import { db } from './db';
import { DocumentChunk } from '../types';

export interface RetrievedPassage {
  chunkText: string;
  chunkIndex: number;
  pageNumber?: number;
  similarity: number;
}

export class RAGService {
  /**
   * Extract raw text and page breakdown from uploaded document
   */
  async extractText(filePath: string, mimeType: string): Promise<{ text: string; pages: Array<{ pageNum: number; text: string }> }> {
    const buffer = fs.readFileSync(filePath);

    if (mimeType === 'application/pdf' || filePath.endsWith('.pdf')) {
      try {
        const data = await pdfParse(buffer);
        // Simple page splitting heuristic based on standard form-feed or page markers
        const pageTexts = data.text.split(/\f|\n\s*--\s*\d+\s*--\s*\n/);
        const pages = pageTexts.map((txt: string, idx: number) => ({
          pageNum: idx + 1,
          text: txt.trim(),
        })).filter((p: { pageNum: number; text: string }) => p.text.length > 0);

        return {
          text: data.text,
          pages: pages.length > 0 ? pages : [{ pageNum: 1, text: data.text }],
        };
      } catch (err: any) {
        console.warn('PDF parsing error, attempting raw fallback:', err.message);
        const fallback = buffer.toString('utf-8');
        return { text: fallback, pages: [{ pageNum: 1, text: fallback }] };
      }
    } else {
      // Plain text or Markdown
      const content = buffer.toString('utf-8');
      return {
        text: content,
        pages: [{ pageNum: 1, text: content }],
      };
    }
  }

  /**
   * Chunk text semantically with overlap to preserve conceptual continuity
   */
  chunkText(
    pages: Array<{ pageNum: number; text: string }>,
    maxChunkChars: number = 800,
    overlapChars: number = 150
  ): Array<{ text: string; pageNum?: number; chunkIndex: number }> {
    const chunks: Array<{ text: string; pageNum?: number; chunkIndex: number }> = [];
    let chunkIndex = 0;

    for (const page of pages) {
      const pageText = page.text.replace(/\r\n/g, '\n');
      // Split into paragraphs first
      const paragraphs = pageText.split(/\n\s*\n/);
      let currentChunk = '';

      for (const para of paragraphs) {
        const cleanPara = para.trim();
        if (!cleanPara) continue;

        if ((currentChunk + '\n\n' + cleanPara).length > maxChunkChars && currentChunk.length > 0) {
          chunks.push({
            text: currentChunk.trim(),
            pageNum: page.pageNum,
            chunkIndex: chunkIndex++,
          });
          // Retain overlap tail
          const words = currentChunk.split(/\s+/);
          const overlap = words.slice(-Math.min(words.length, 25)).join(' ');
          currentChunk = overlap + '\n\n' + cleanPara;
        } else {
          currentChunk = currentChunk ? currentChunk + '\n\n' + cleanPara : cleanPara;
        }
      }

      if (currentChunk.trim().length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          pageNum: page.pageNum,
          chunkIndex: chunkIndex++,
        });
      }
    }

    return chunks;
  }

  /**
   * Process and index an uploaded document: chunk, embed, and store
   */
  async processAndIndexDocument(documentId: string, filePath: string, mimeType: string): Promise<number> {
    const { pages, text } = await this.extractText(filePath, mimeType);
    const rawChunks = this.chunkText(pages);

    const chunkRecords: Array<Omit<DocumentChunk, 'id' | 'created_at'>> = [];

    for (const ch of rawChunks) {
      const embedding = await ai.createEmbedding(ch.text);
      chunkRecords.push({
        document_id: documentId,
        chunk_text: ch.text,
        chunk_index: ch.chunkIndex,
        page_number: ch.pageNum,
        token_count: Math.round(ch.text.length / 4),
        embedding,
      });
    }

    await db.saveDocumentChunks(chunkRecords);

    // Generate concise summary of the document for overview
    const previewText = text.slice(0, 3000);
    const summary = `Document containing ${rawChunks.length} sections across ${pages.length} pages. Key themes include: ${previewText.slice(0, 200)}...`;
    await db.updateStudyDocument('', documentId, {
      processing_status: 'completed',
      chunk_count: rawChunks.length,
      summary,
    });

    return rawChunks.length;
  }

  /**
   * Retrieve relevant passages using cosine similarity
   */
  async retrieveRelevantChunks(documentId: string, query: string, topK: number = 4): Promise<RetrievedPassage[]> {
    const chunks = await db.getDocumentChunks(documentId);
    if (!chunks || chunks.length === 0) return [];

    const queryEmbedding = await ai.createEmbedding(query);

    const scored = chunks.map((chunk) => {
      let similarity = 0;
      if (chunk.embedding && chunk.embedding.length > 0 && queryEmbedding.length > 0) {
        similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      } else {
        // Fallback keyword frequency match
        similarity = this.lexicalSimilarity(query, chunk.chunk_text);
      }
      return {
        chunkText: chunk.chunk_text,
        chunkIndex: chunk.chunk_index,
        pageNumber: chunk.page_number,
        similarity,
      };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom > 0 ? dot / denom : 0;
  }

  private lexicalSimilarity(query: string, text: string): number {
    const qWords = new Set(query.toLowerCase().match(/\w+/g) || []);
    const tWords = text.toLowerCase().match(/\w+/g) || [];
    if (qWords.size === 0 || tWords.length === 0) return 0;
    let matches = 0;
    for (const w of tWords) {
      if (qWords.has(w)) matches++;
    }
    return matches / (tWords.length + qWords.size);
  }
}

export const rag = new RAGService();
