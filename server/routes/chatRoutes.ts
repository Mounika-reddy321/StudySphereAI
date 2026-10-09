import { Router, Response } from 'express';
import { db, ChatMessage, Conversation } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';
import { ai, DEFAULT_MODEL, buildSystemInstruction, ThinkingLevel } from '../gemini.js';
import { retrieveRelevantChunks } from '../rag.js';

export const chatRouter = Router();

// List conversations
chatRouter.get('/conversations', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const conversations = db.getConversations(user.id);
  res.json(conversations);
});

// Create new conversation
chatRouter.post('/conversations', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { title, subject, learningMode = 'general', documentId, language } = req.body;

  const conv: Conversation = {
    id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    title: (title || 'New Study Session').trim(),
    subject,
    learningMode,
    documentId,
    language: language || user.preferredLanguage || 'English',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createConversation(conv);
  res.status(201).json(conv);
});

// Get conversation with messages
chatRouter.get('/conversations/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const conv = db.getConversationById(req.params.id, user.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }
  const messages = db.getMessages(conv.id);
  res.json({ conversation: conv, messages });
});

// Update conversation (title / learningMode / language)
chatRouter.put('/conversations/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { title, learningMode, language, documentId } = req.body;
  const updated = db.updateConversation(req.params.id, user.id, {
    ...(title ? { title: title.trim() } : {}),
    ...(learningMode ? { learningMode } : {}),
    ...(language ? { language } : {}),
    ...(documentId !== undefined ? { documentId } : {}),
  });

  if (!updated) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }
  res.json(updated);
});

// Delete conversation
chatRouter.delete('/conversations/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const deleted = db.deleteConversation(req.params.id, user.id);
  if (deleted) {
    res.json({ success: true, message: 'Conversation deleted.' });
  } else {
    res.status(404).json({ error: 'Conversation not found.' });
  }
});

// Send Chat Message & Generate AI Response (Fast with ThinkingLevel.LOW)
chatRouter.post('/chat', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const {
    conversationId,
    message,
    learningMode,
    documentId,
    language,
    knowledgeLevel = 'Intermediate',
  } = req.body;

  if (!message || !message.trim()) {
    res.status(400).json({ error: 'Message cannot be empty.' });
    return;
  }

  // Ensure conversation exists or create one
  let conv: Conversation | undefined;
  if (conversationId) {
    conv = db.getConversationById(conversationId, user.id);
  }

  if (!conv) {
    conv = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      title: message.trim().slice(0, 45) + (message.length > 45 ? '...' : ''),
      learningMode: learningMode || 'general',
      documentId,
      language: language || user.preferredLanguage || 'English',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.createConversation(conv);
  }

  // 1. Save user message
  const userMsg: ChatMessage = {
    id: `msg-${Date.now()}-u`,
    conversationId: conv.id,
    role: 'user',
    content: message.trim(),
    timestamp: new Date().toISOString(),
    learningMode: learningMode || conv.learningMode,
  };
  db.createMessage(userMsg);

  // 2. Fetch past conversation history (last 8 messages for snappy context)
  const previousMsgs = db.getMessages(conv.id).filter(m => m.id !== userMsg.id).slice(-8);

  // 3. Fast memory retrieval (only if user has memory enabled)
  let memoryTexts: string[] = [];
  if (user.enableMemory) {
    const allMemories = db.getMemories(user.id);
    const queryTokens = message.toLowerCase().split(/\W+/).filter((t: string) => t.length > 3);
    const relevant = allMemories.filter(m => {
      const factLower = m.fact.toLowerCase();
      return queryTokens.some((tok: string) => factLower.includes(tok)) || m.category === 'goal' || m.category === 'preference';
    });
    memoryTexts = (relevant.length > 0 ? relevant : allMemories.slice(0, 3)).map(m => m.fact);
  }

  // 4. Retrieve RAG document context only when a document is linked
  let docContext = '';
  const citations: { documentTitle: string; chunkIndex: number; snippet: string }[] = [];
  const targetDocId = documentId || conv.documentId;

  if (targetDocId) {
    const userDocs = db.getDocuments(user.id);
    const docsToSearch = userDocs.filter(d => d.id === targetDocId);

    if (docsToSearch.length > 0) {
      try {
        const retrieved = await retrieveRelevantChunks(message, docsToSearch, 3);
        if (retrieved.length > 0) {
          docContext = retrieved.map((r, idx) => {
            citations.push({
              documentTitle: r.documentTitle,
              chunkIndex: r.chunkIndex,
              snippet: r.content.slice(0, 180) + '...',
            });
            return `[Source #${idx + 1}: ${r.documentTitle} (Chunk ${r.chunkIndex}${r.page ? `, Page ${r.page}` : ''})]\n${r.content}`;
          }).join('\n\n');
        }
      } catch (err) {
        console.warn('RAG retrieval failed, proceeding without doc context:', err);
      }
    }
  }

  // 5. Construct Gemini system instruction & conversation contents
  const activeLearningMode = learningMode || conv.learningMode || 'general';
  const activeLanguage = language || conv.language || user.preferredLanguage || 'English';

  const systemInstruction = buildSystemInstruction({
    learningMode: activeLearningMode,
    language: activeLanguage,
    memories: memoryTexts,
    documentContext: docContext,
    knowledgeLevel,
  });

  const contents: any[] = [];
  for (const m of previousMsgs) {
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: message.trim() }],
  });

  try {
    // Call Gemini 3.1 Flash-Lite with MINIMAL thinking for sub-second responses
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    let rawOutput = response.text || "I'm ready to help you learn! What topic shall we explore next?";

    // 6. Check for memory suggestion pattern
    let memorySuggestion: string | undefined = undefined;
    const memMatch = rawOutput.match(/:::memory_suggestion:\s*(.*?)\s*:::/i);
    if (memMatch) {
      memorySuggestion = memMatch[1]?.trim();
      rawOutput = rawOutput.replace(/:::memory_suggestion:\s*(.*?)\s*:::/i, '').trim();
    }

    // 7. Save assistant message
    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      conversationId: conv.id,
      role: 'assistant',
      content: rawOutput,
      timestamp: new Date().toISOString(),
      documentCitations: citations.length > 0 ? citations : undefined,
      memorySuggestion,
      learningMode: activeLearningMode,
    };
    db.createMessage(assistantMsg);

    db.logActivity(user.id, 'chat', `Studied "${conv.title.slice(0, 30)}..." in ${activeLearningMode} mode`);

    res.json({
      conversationId: conv.id,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  } catch (err: any) {
    console.error('Error generating chat response:', err);
    res.status(500).json({
      error: `Failed to generate AI response: ${err.message || 'Unknown error'}`,
    });
  }
});

// Real-Time Streaming Chat Endpoint (Server-Sent Events) - Instant first token!
chatRouter.post('/chat/stream', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const {
    conversationId,
    message,
    learningMode,
    documentId,
    language,
    knowledgeLevel = 'Intermediate',
  } = req.body;

  if (!message || !message.trim()) {
    res.status(400).json({ error: 'Message cannot be empty.' });
    return;
  }

  // Ensure conversation exists or create one
  let conv: Conversation | undefined;
  if (conversationId) {
    conv = db.getConversationById(conversationId, user.id);
  }

  if (!conv) {
    conv = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      title: message.trim().slice(0, 45) + (message.length > 45 ? '...' : ''),
      learningMode: learningMode || 'general',
      documentId,
      language: language || user.preferredLanguage || 'English',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.createConversation(conv);
  }

  // 1. Save user message
  const userMsg: ChatMessage = {
    id: `msg-${Date.now()}-u`,
    conversationId: conv.id,
    role: 'user',
    content: message.trim(),
    timestamp: new Date().toISOString(),
    learningMode: learningMode || conv.learningMode,
  };
  db.createMessage(userMsg);

  // 2. Fetch past conversation history (last 8 messages)
  const previousMsgs = db.getMessages(conv.id).filter(m => m.id !== userMsg.id).slice(-8);

  // 3. Fast memory retrieval
  let memoryTexts: string[] = [];
  if (user.enableMemory) {
    const allMemories = db.getMemories(user.id);
    const queryTokens = message.toLowerCase().split(/\W+/).filter((t: string) => t.length > 3);
    const relevant = allMemories.filter(m => {
      const factLower = m.fact.toLowerCase();
      return queryTokens.some((tok: string) => factLower.includes(tok)) || m.category === 'goal' || m.category === 'preference';
    });
    memoryTexts = (relevant.length > 0 ? relevant : allMemories.slice(0, 3)).map(m => m.fact);
  }

  // 4. Retrieve RAG document context only when a document is linked
  let docContext = '';
  const citations: { documentTitle: string; chunkIndex: number; snippet: string }[] = [];
  const targetDocId = documentId || conv.documentId;

  if (targetDocId) {
    const userDocs = db.getDocuments(user.id);
    const docsToSearch = userDocs.filter(d => d.id === targetDocId);

    if (docsToSearch.length > 0) {
      try {
        const retrieved = await retrieveRelevantChunks(message, docsToSearch, 3);
        if (retrieved.length > 0) {
          docContext = retrieved.map((r, idx) => {
            citations.push({
              documentTitle: r.documentTitle,
              chunkIndex: r.chunkIndex,
              snippet: r.content.slice(0, 180) + '...',
            });
            return `[Source #${idx + 1}: ${r.documentTitle} (Chunk ${r.chunkIndex}${r.page ? `, Page ${r.page}` : ''})]\n${r.content}`;
          }).join('\n\n');
        }
      } catch (err) {
        console.warn('RAG retrieval failed, proceeding without doc context:', err);
      }
    }
  }

  // 5. Construct Gemini system instruction & conversation contents
  const activeLearningMode = learningMode || conv.learningMode || 'general';
  const activeLanguage = language || conv.language || user.preferredLanguage || 'English';

  const systemInstruction = buildSystemInstruction({
    learningMode: activeLearningMode,
    language: activeLanguage,
    memories: memoryTexts,
    documentContext: docContext,
    knowledgeLevel,
  });

  const contents: any[] = [];
  for (const m of previousMsgs) {
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: message.trim() }],
  });

  // Prepare Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send initial event
  res.write(`event: init\ndata: ${JSON.stringify({ conversationId: conv.id, userMessage: userMsg })}\n\n`);
  if (typeof (res as any).flush === 'function') (res as any).flush();

  let fullOutput = '';
  let isClosed = false;

  res.on('close', () => {
    if (!res.writableEnded) {
      isClosed = true;
    }
  });

  try {
    const stream = await ai.models.generateContentStream({
      model: DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    for await (const chunk of stream) {
      if (isClosed) break;
      const text = chunk.text || '';
      if (text) {
        fullOutput += text;
        res.write(`event: chunk\ndata: ${JSON.stringify({ text })}\n\n`);
        if (typeof (res as any).flush === 'function') (res as any).flush();
      }
    }

    if (!fullOutput) {
      fullOutput = "I'm ready to help you learn! What topic shall we explore next?";
    }

    // Check for memory suggestion pattern
    let memorySuggestion: string | undefined = undefined;
    const memMatch = fullOutput.match(/:::memory_suggestion:\s*(.*?)\s*:::/i);
    if (memMatch) {
      memorySuggestion = memMatch[1]?.trim();
      fullOutput = fullOutput.replace(/:::memory_suggestion:\s*(.*?)\s*:::/i, '').trim();
    }

    // Save assistant message to DB
    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      conversationId: conv.id,
      role: 'assistant',
      content: fullOutput,
      timestamp: new Date().toISOString(),
      documentCitations: citations.length > 0 ? citations : undefined,
      memorySuggestion,
      learningMode: activeLearningMode,
    };
    db.createMessage(assistantMsg);
    db.logActivity(user.id, 'chat', `Studied "${conv.title.slice(0, 30)}..." in ${activeLearningMode} mode`);

    if (!isClosed) {
      res.write(`event: done\ndata: ${JSON.stringify({ assistantMessage: assistantMsg })}\n\n`);
      res.end();
    }
  } catch (err: any) {
    console.error('Error during streaming generation:', err);
    if (!isClosed) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message || 'Stream generation failed' })}\n\n`);
      res.end();
    }
  }
});
