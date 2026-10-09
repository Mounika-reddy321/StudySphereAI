import { Router, Response } from 'express';
import { db, StudyPlan, StudyStage, StudyTask } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';
import { ai, DEFAULT_MODEL, ThinkingLevel } from '../gemini.js';

export const plannerRouter = Router();

// List user study plans
plannerRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  res.json(db.getStudyPlans(user.id));
});

// Generate study plan with Gemini
plannerRouter.post('/generate', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const {
    goal,
    targetLevel = 'intermediate',
    timeframeWeeks = 4,
    availableHoursPerWeek = 6,
  } = req.body;

  if (!goal || !goal.trim()) {
    res.status(400).json({ error: 'Learning goal cannot be empty.' });
    return;
  }

  const prompt = `You are an expert curriculum designer and academic study planner.
Generate a realistic, highly actionable study plan roadmap for a student with:
- Learning Goal: "${goal}"
- Current Skill Level: "${targetLevel}"
- Total Timeframe: ${timeframeWeeks} weeks
- Available Commitment: ${availableHoursPerWeek} hours per week
- Preferred Language: ${user.preferredLanguage || 'English'}

Break the plan down into 3-4 progressive stages. Each stage must contain 3-4 concrete actionable tasks with realistic durations in minutes and appropriate types ("concept" | "reading" | "practice" | "quiz" | "revision").

Return ONLY a valid JSON object matching this schema:
{
  "title": "A motivating, descriptive title for this roadmap",
  "stages": [
    {
      "title": "Stage 1: Foundational Core",
      "tasks": [
        {
          "title": "Task title",
          "description": "Clear instructions on what to learn or do",
          "durationMinutes": 45,
          "type": "concept" | "reading" | "practice" | "quiz" | "revision"
        }
      ]
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const stages: StudyStage[] = (parsed.stages || []).map((s: any, sIdx: number) => ({
      id: `stg-${Date.now()}-${sIdx + 1}`,
      title: s.title || `Stage ${sIdx + 1}`,
      order: sIdx + 1,
      tasks: (s.tasks || []).map((t: any, tIdx: number) => ({
        id: `tsk-${Date.now()}-${sIdx + 1}-${tIdx + 1}`,
        title: t.title || 'Study Task',
        description: t.description || '',
        durationMinutes: Number(t.durationMinutes) || 45,
        completed: false,
        type: t.type || 'concept',
      })),
    }));

    if (stages.length === 0) {
      res.status(500).json({ error: 'Failed to generate roadmap stages. Please try again.' });
      return;
    }

    const plan: StudyPlan = {
      id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      title: parsed.title || `Roadmap: ${goal}`,
      goal: goal.trim(),
      targetLevel,
      timeframeWeeks: Number(timeframeWeeks) || 4,
      availableHoursPerWeek: Number(availableHoursPerWeek) || 6,
      status: 'active',
      stages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createStudyPlan(plan);
    db.logActivity(user.id, 'lesson_learned', `Created personalized study roadmap for "${plan.title}"`);

    res.status(201).json(plan);
  } catch (err: any) {
    console.error('Study plan generation failed:', err);
    res.status(500).json({ error: `Roadmap generation failed: ${err.message || 'Unknown error'}` });
  }
});

// Toggle task completion
plannerRouter.put('/:id/tasks/:taskId', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { id, taskId } = req.params;
  const { completed } = req.body;

  const plan = db.getStudyPlanById(id, user.id);
  if (!plan) {
    res.status(404).json({ error: 'Study plan not found.' });
    return;
  }

  let taskFound: StudyTask | undefined;
  for (const stage of plan.stages) {
    const t = stage.tasks.find(tk => tk.id === taskId);
    if (t) {
      t.completed = typeof completed === 'boolean' ? completed : !t.completed;
      taskFound = t;
      break;
    }
  }

  if (!taskFound) {
    res.status(404).json({ error: 'Task not found in this study plan.' });
    return;
  }

  db.updateStudyPlan(plan.id, user.id, { stages: plan.stages });

  if (taskFound.completed) {
    db.logActivity(user.id, 'task_completed', `Completed study task "${taskFound.title}"`);
  }

  res.json({
    task: taskFound,
    plan,
  });
});

// Update plan status
plannerRouter.put('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { status, title } = req.body;
  const updated = db.updateStudyPlan(req.params.id, user.id, {
    ...(status ? { status } : {}),
    ...(title ? { title: title.trim() } : {}),
  });

  if (!updated) {
    res.status(404).json({ error: 'Study plan not found.' });
    return;
  }
  res.json(updated);
});

// Delete study plan
plannerRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const deleted = db.deleteStudyPlan(req.params.id, user.id);
  if (deleted) {
    res.json({ success: true, message: 'Study plan deleted.' });
  } else {
    res.status(404).json({ error: 'Study plan not found.' });
  }
});
