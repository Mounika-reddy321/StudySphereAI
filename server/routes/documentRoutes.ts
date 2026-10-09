import { Router, Response } from 'express';
import multer from 'multer';
import { db, DocumentItem } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';
import { chunkText, parseFileBuffer } from '../rag.js';
import { ai, DEFAULT_MODEL, generateEmbedding, ThinkingLevel } from '../gemini.js';

export const documentRouter = Router();

const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

// List user documents
documentRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const docs = db.getDocuments(user.id).map(d => ({
    id: d.id,
    title: d.title,
    filename: d.filename,
    fileType: d.fileType,
    fileSize: d.fileSize,
    chunkCount: d.chunkCount,
    createdAt: d.createdAt,
    summary: d.summary,
  }));
  res.json(docs);
});

// Upload and process document
documentRouter.post('/upload', requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'No file uploaded.' });
    return;
  }

  try {
    const rawText = await parseFileBuffer(file.buffer, file.originalname, file.mimetype);
    if (!rawText || !rawText.trim()) {
      res.status(400).json({ error: 'Uploaded file contains no readable text.' });
      return;
    }

    const chunks = chunkText(rawText);

    // Compute embeddings for the first few chunks (up to 8 to avoid rate limits, fallback gracefully)
    for (let i = 0; i < Math.min(chunks.length, 8); i++) {
      try {
        const emb = await generateEmbedding(chunks[i].content);
        if (emb) {
          chunks[i].embedding = emb;
        }
      } catch {
        // Silently continue, hybrid BM25 will still work
      }
    }

    // Generate a quick AI summary of the document
    let summary: string | undefined = undefined;
    try {
      const summaryResp = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: `Summarize the key topic and educational value of this document in 2 concise sentences:\n\n${rawText.slice(0, 3000)}`,
      });
      summary = summaryResp.text?.trim();
    } catch (err) {
      console.warn('Document summary generation skipped:', err);
    }

    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDoc: DocumentItem = {
      id: docId,
      userId: user.id,
      title: file.originalname.replace(/\.[^/.]+$/, ''),
      filename: file.originalname,
      fileType: file.mimetype || 'text/plain',
      fileSize: file.size,
      chunkCount: chunks.length,
      extractedText: rawText,
      chunks,
      summary,
      createdAt: new Date().toISOString(),
    };

    db.createDocument(newDoc);
    db.logActivity(user.id, 'document_uploaded', `Uploaded study material "${newDoc.title}" (${chunks.length} chunks indexed)`);

    res.status(201).json({
      id: newDoc.id,
      title: newDoc.title,
      filename: newDoc.filename,
      chunkCount: newDoc.chunkCount,
      summary: newDoc.summary,
      createdAt: newDoc.createdAt,
    });
  } catch (err: any) {
    console.error('Error processing document upload:', err);
    res.status(500).json({ error: `Failed to process document: ${err.message || 'Unknown error'}` });
  }
});

// Get document details & chunk previews
documentRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const doc = db.getDocumentById(req.params.id, user.id);

  if (!doc) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }

  res.json({
    id: doc.id,
    title: doc.title,
    filename: doc.filename,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    chunkCount: doc.chunkCount,
    summary: doc.summary,
    createdAt: doc.createdAt,
    chunks: doc.chunks.map(c => ({
      id: c.id,
      chunkIndex: c.chunkIndex,
      page: c.page,
      snippet: c.content.slice(0, 300) + (c.content.length > 300 ? '...' : ''),
    })),
  });
});

// Delete document
documentRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const deleted = db.deleteDocument(req.params.id, user.id);

  if (deleted) {
    res.json({ success: true, message: 'Document deleted from knowledge base.' });
  } else {
    res.status(404).json({ error: 'Document not found.' });
  }
});

// Document Quick Actions (Summary, Explain Passage, Definitions, Exam Questions, Revision Notes)
documentRouter.post('/:id/actions', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { action, passage } = req.body;
  const doc = db.getDocumentById(req.params.id, user.id);

  if (!doc) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }

  const excerpt = passage && passage.trim() ? passage : doc.extractedText.slice(0, 6000);

  let prompt = '';
  switch (action) {
    case 'summarize':
      prompt = `Provide a comprehensive structured summary of this study material with Key Takeaways and Core Insights:\n\n${excerpt}`;
      break;
    case 'explain':
      prompt = `Explain the most complex or difficult concepts in this material using simple analogies and step-by-step clarity:\n\n${excerpt}`;
      break;
    case 'definitions':
      prompt = `Extract a glossary of important definitions, technical terms, and formulas from this material with clear explanations:\n\n${excerpt}`;
      break;
    case 'exam-questions':
      prompt = `Create 5 high-yield university-level examination questions (with detailed model solutions) based on this material:\n\n${excerpt}`;
      break;
    case 'revision-notes':
      prompt = `Generate a high-impact revision sheet with bullet points, flashcard-style concepts, and key test traps from this material:\n\n${excerpt}`;
      break;
    default:
      res.status(400).json({ error: 'Invalid action specified.' });
      return;
  }

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are StudySphere, generating academic study aids for the document titled "${doc.title}". Respond in clear, beautifully formatted Markdown in ${user.preferredLanguage}.`,
      },
    });

    res.json({
      action,
      documentTitle: doc.title,
      result: response.text || 'No response generated.',
    });
  } catch (err: any) {
    console.error('Error running document action:', err);
    res.status(500).json({ error: `AI generation failed: ${err.message || 'Unknown error'}` });
  }
});
