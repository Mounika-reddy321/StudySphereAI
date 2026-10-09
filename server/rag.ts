import { DocumentChunk, DocumentItem } from './db.js';
import { generateEmbedding } from './gemini.js';
import * as pdfParseModule from 'pdf-parse';
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;

export function chunkText(text: string, chunkSize = 700, overlap = 120): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const cleaned = text.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [];

  let start = 0;
  let chunkIdx = 0;

  while (start < cleaned.length) {
    let end = start + chunkSize;
    if (end < cleaned.length) {
      // Find nearest punctuation / newline to make a clean break
      const lookahead = cleaned.slice(end, Math.min(cleaned.length, end + 80));
      const breakPoint = lookahead.search(/[.\n!?]/);
      if (breakPoint !== -1) {
        end += breakPoint + 1;
      }
    } else {
      end = cleaned.length;
    }

    const chunkStr = cleaned.slice(start, end).trim();
    if (chunkStr.length > 20) {
      chunks.push({
        id: `chk-${Date.now()}-${chunkIdx}`,
        chunkIndex: chunkIdx + 1,
        content: chunkStr,
        page: Math.floor(start / 2000) + 1,
      });
      chunkIdx++;
    }

    if (end >= cleaned.length) break;
    start = end - overlap;
  }

  return chunks;
}

export async function parseFileBuffer(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const lowerName = filename.toLowerCase();

  if (mimeType.includes('pdf') || lowerName.endsWith('.pdf')) {
    try {
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch (err) {
      console.error('pdf-parse failed, falling back to raw text decode:', err);
      return buffer.toString('utf-8');
    }
  }

  // TXT, Markdown, JSON, CSV
  return buffer.toString('utf-8');
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function keywordRelevance(query: string, content: string): number {
  const queryTokens = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
  if (queryTokens.length === 0) return 0;

  const contentLower = content.toLowerCase();
  let hits = 0;
  for (const token of queryTokens) {
    if (contentLower.includes(token)) {
      hits++;
    }
  }
  return hits / queryTokens.length;
}

export interface RetrievedChunk {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  page?: number;
  content: string;
  score: number;
}

export async function retrieveRelevantChunks(
  query: string,
  documents: DocumentItem[],
  topK = 4
): Promise<RetrievedChunk[]> {
  if (documents.length === 0) return [];

  // Try generating embedding for query
  const queryEmbedding = await generateEmbedding(query);

  const scoredChunks: RetrievedChunk[] = [];

  for (const doc of documents) {
    for (const chunk of doc.chunks) {
      let score = 0;

      // Semantic score if embeddings exist
      if (queryEmbedding && chunk.embedding) {
        const sim = cosineSimilarity(queryEmbedding, chunk.embedding);
        score += sim * 0.7;
      }

      // Keyword BM25 / token score
      const kwScore = keywordRelevance(query, chunk.content);
      score += kwScore * (queryEmbedding ? 0.3 : 1.0);

      if (score > 0.05) {
        scoredChunks.push({
          documentId: doc.id,
          documentTitle: doc.title,
          chunkIndex: chunk.chunkIndex,
          page: chunk.page,
          content: chunk.content,
          score,
        });
      }
    }
  }

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK);
}
