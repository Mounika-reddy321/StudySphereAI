import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { authRouter } from './server/routes/authRoutes.js';
import { chatRouter } from './server/routes/chatRoutes.js';
import { memoryRouter } from './server/routes/memoryRoutes.js';
import { documentRouter } from './server/routes/documentRoutes.js';
import { quizRouter } from './server/routes/quizRoutes.js';
import { plannerRouter } from './server/routes/plannerRoutes.js';
import { analyticsRouter } from './server/routes/analyticsRoutes.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health / Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    service: 'StudySphere Backend API',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/memories', memoryRouter);
app.use('/api/documents', documentRouter);
app.use('/api', chatRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/study-plans', plannerRouter);
app.use('/api/analytics', analyticsRouter);

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudySphere server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
