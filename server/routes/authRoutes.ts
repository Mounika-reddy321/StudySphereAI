import { Router, Response } from 'express';
import { db, User } from '../db.js';
import { generateSalt, hashPassword, generateToken, requireAuth, AuthenticatedRequest } from '../auth.js';

export const authRouter = Router();

// Register
authRouter.post('/register', (req, res: Response): void => {
  const { email, password, name, preferredLanguage } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Email, name, and password are required.' });
    return;
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const newUser: User = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    passwordHash,
    salt,
    preferredLanguage: preferredLanguage || 'English',
    theme: 'light',
    enableMemory: true,
    createdAt: new Date().toISOString(),
  };

  db.createUser(newUser);
  db.logActivity(newUser.id, 'lesson_learned', 'Created StudySphere account and set up personal learning profile');

  const token = generateToken(newUser);
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      preferredLanguage: newUser.preferredLanguage,
      theme: newUser.theme,
      enableMemory: newUser.enableMemory,
    },
  });
});

// Login
authRouter.post('/login', (req, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      preferredLanguage: user.preferredLanguage,
      theme: user.theme,
      enableMemory: user.enableMemory,
    },
  });
});

// Get current user profile
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    preferredLanguage: user.preferredLanguage,
    theme: user.theme,
    enableMemory: user.enableMemory,
  });
});

// Update profile / settings
authRouter.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { name, preferredLanguage, theme, enableMemory } = req.body;

  const updates: Partial<User> = {};
  if (typeof name === 'string' && name.trim()) updates.name = name.trim();
  if (typeof preferredLanguage === 'string') updates.preferredLanguage = preferredLanguage;
  if (theme === 'light' || theme === 'dark') updates.theme = theme;
  if (typeof enableMemory === 'boolean') updates.enableMemory = enableMemory;

  const updated = db.updateUser(user.id, updates);
  res.json(updated);
});

// Delete account and all private data
authRouter.delete('/account', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const success = db.deleteUser(user.id);
  if (success) {
    res.json({ message: 'Account and associated data deleted successfully.' });
  } else {
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});
