import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';
import { ai, DEFAULT_MODEL, ThinkingLevel } from '../gemini.js';

export const analyticsRouter = Router();

function calculateStreak(activities: { timestamp: string }[]): number {
  if (activities.length === 0) return 0;

  const dates = new Set(
    activities.map(a => new Date(a.timestamp).toISOString().split('T')[0])
  );

  const sortedDates = Array.from(dates).sort().reverse();
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // If user hasn't studied today or yesterday, current streak is 0
  if (!dates.has(todayStr) && !dates.has(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  let checkDate = dates.has(todayStr) ? new Date() : new Date(Date.now() - 86400000);

  while (true) {
    const ds = checkDate.toISOString().split('T')[0];
    if (dates.has(ds)) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      break;
    }
  }

  return streak;
}

analyticsRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;

  const conversations = db.getConversations(user.id);
  const quizAttempts = db.getQuizAttempts(user.id);
  const studyPlans = db.getStudyPlans(user.id);
  const documents = db.getDocuments(user.id);
  const activities = db.getActivities(user.id);
  const memories = db.getMemories(user.id);

  // Calculate task counts
  let totalTasks = 0;
  let completedTasks = 0;
  for (const plan of studyPlans) {
    for (const stage of plan.stages) {
      for (const t of stage.tasks) {
        totalTasks++;
        if (t.completed) completedTasks++;
      }
    }
  }

  // Calculate Quiz Stats
  const totalQuizAttempts = quizAttempts.length;
  const avgQuizScore = totalQuizAttempts > 0
    ? Math.round(quizAttempts.reduce((acc, a) => acc + a.percentage, 0) / totalQuizAttempts)
    : 0;

  // Real Streak
  const streakDays = calculateStreak(activities);

  // Topics studied
  const distinctTopics = Array.from(
    new Set(
      conversations
        .map(c => c.subject || c.title)
        .concat(quizAttempts.map(q => q.quizTitle))
    )
  ).slice(0, 8);

  // Areas needing revision
  const revisionTopics: string[] = [];
  for (const attempt of quizAttempts) {
    if (attempt.percentage < 75 && attempt.recommendedTopics) {
      revisionTopics.push(...attempt.recommendedTopics);
    }
  }
  const uniqueRevision = Array.from(new Set(revisionTopics)).slice(0, 5);

  // Estimated total study minutes from completed tasks + quizzes (10 min each) + chats (5 min each)
  const taskMinutes = completedTasks * 45;
  const quizMinutes = totalQuizAttempts * 10;
  const chatMinutes = conversations.length * 8;
  const totalStudyMinutes = taskMinutes + quizMinutes + chatMinutes;

  // AI-generated smart recommendations
  let aiRecommendation = 'Great progress! Review your study roadmap tasks and attempt a new quiz on your recently covered topics.';
  if (distinctTopics.length > 0) {
    try {
      const prompt = `Based on a student's real learning data:
- Recent Topics Studied: ${distinctTopics.join(', ')}
- Total Quiz Attempts: ${totalQuizAttempts} (Average Score: ${avgQuizScore}%)
- Completed Study Tasks: ${completedTasks}/${totalTasks}
- Areas Needing Revision: ${uniqueRevision.join(', ') || 'None identified yet'}

Generate 2 concise, encouraging, and highly specific next-step study suggestions (2 bullet points max).`;

      const aiResp = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
        config: {
          systemInstruction: 'You are StudySphere Learning Analytics. Be constructive and specific.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        },
      });
      aiRecommendation = aiResp.text?.trim() || aiRecommendation;
    } catch {
      // Keep default recommendation
    }
  }

  res.json({
    metrics: {
      topicsStudiedCount: distinctTopics.length,
      conversationsCount: conversations.length,
      documentsCount: documents.length,
      memoriesCount: memories.length,
      totalQuizAttempts,
      avgQuizScore,
      totalTasks,
      completedTasks,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      streakDays,
      totalStudyHours: Math.round((totalStudyMinutes / 60) * 10) / 10,
    },
    distinctTopics,
    revisionAreas: uniqueRevision,
    recentActivities: activities.slice(0, 15),
    aiRecommendation,
    recentQuizScores: quizAttempts.slice(0, 5).map(a => ({
      title: a.quizTitle,
      percentage: a.percentage,
      date: a.completedAt.split('T')[0],
    })),
  });
});
