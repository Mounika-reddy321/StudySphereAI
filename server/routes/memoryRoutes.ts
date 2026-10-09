import { Router, Response } from 'express';
import { db, Memory } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';

export const memoryRouter = Router();

// Get all memories for current user
memoryRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const q = typeof req.query.q === 'string' ? req.query.q.toLowerCase() : '';
  let memories = db.getMemories(user.id);

  if (q) {
    memories = memories.filter(m => m.fact.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
  }

  res.json({
    memories,
    memoryEnabled: user.enableMemory,
  });
});

// Add a memory
memoryRouter.post('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { fact, category = 'general', source } = req.body;

  if (!fact || typeof fact !== 'string' || !fact.trim()) {
    res.status(400).json({ error: 'Memory fact cannot be empty.' });
    return;
  }

  const newMemory: Memory = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    fact: fact.trim(),
    category: category as any,
    source,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createMemory(newMemory);
  db.logActivity(user.id, 'lesson_learned', `Saved new study memory: "${fact.slice(0, 40)}..."`);

  res.status(201).json(newMemory);
});

// Update a memory
memoryRouter.put('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { id } = req.params;
  const { fact, category } = req.body;

  const existing = db.getMemoryById(id);
  if (!existing || existing.userId !== user.id) {
    res.status(404).json({ error: 'Memory item not found.' });
    return;
  }

  const updated = db.updateMemory(id, {
    ...(fact ? { fact: fact.trim() } : {}),
    ...(category ? { category } : {}),
  });

  res.json(updated);
});

// Delete a memory
memoryRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { id } = req.params;

  const deleted = db.deleteMemory(id, user.id);
  if (deleted) {
    res.json({ success: true, message: 'Memory deleted.' });
  } else {
    res.status(404).json({ error: 'Memory not found.' });
  }
});

// Clear all memories for user
memoryRouter.post('/clear', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  db.clearMemories(user.id);
  res.json({ success: true, message: 'All memories cleared.' });
});
