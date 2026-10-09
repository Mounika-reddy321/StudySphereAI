import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Layers,
  Trash2,
  Play,
  Pause,
  Plus,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StudyPlan, StudyTask } from '../types/index.js';
import { api } from '../services/api.js';

interface PlannerViewProps {
  onRefreshPlans: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  onRefreshPlans,
  onNavigateToTab,
}) => {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Roadmap creation form
  const [goal, setGoal] = useState('');
  const [targetLevel, setTargetLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [timeframeWeeks, setTimeframeWeeks] = useState(4);
  const [hoursPerWeek, setHoursPerWeek] = useState(6);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await api.getStudyPlans();
      setPlans(data);
      if (data.length > 0 && !selectedPlanId) {
        setSelectedPlanId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load study plans:', err);
    }
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setIsGenerating(true);
    try {
      const newPlan = await api.generateStudyPlan({
        goal: goal.trim(),
        targetLevel,
        timeframeWeeks: Number(timeframeWeeks),
        availableHoursPerWeek: Number(hoursPerWeek),
      });

      setPlans(prev => [newPlan, ...prev]);
      setSelectedPlanId(newPlan.id);
      setGoal('');
      onRefreshPlans();
    } catch (err: any) {
      alert(`Roadmap generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = async (planId: string, taskId: string, currentCompleted: boolean) => {
    try {
      const res = await api.toggleTask(planId, taskId, !currentCompleted);
      setPlans(prev => prev.map(p => (p.id === planId ? res.plan : p)));
      onRefreshPlans();
    } catch (err: any) {
      alert(`Failed to update task: ${err.message}`);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (confirm('Permanently delete this study roadmap?')) {
      try {
        await api.deleteStudyPlan(planId);
        setPlans(prev => prev.filter(p => p.id !== planId));
        if (selectedPlanId === planId) {
          const remaining = plans.filter(p => p.id !== planId);
          setSelectedPlanId(remaining.length > 0 ? remaining[0].id : null);
        }
        onRefreshPlans();
      } catch (err: any) {
        alert(`Failed to delete plan: ${err.message}`);
      }
    }
  };

  const activePlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  // Calculate completion percentage
  let totalTasks = 0;
  let completedTasks = 0;
  if (activePlan) {
    for (const stage of activePlan.stages) {
      for (const t of stage.tasks) {
        totalTasks++;
        if (t.completed) completedTasks++;
      }
    }
  }
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const taskTypeIcons: Record<string, string> = {
    concept: '💡 Concept',
    reading: '📖 Reading',
    practice: '💻 Practice',
    quiz: '🎯 Knowledge Check',
    revision: '🔄 Revision',
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>AI Curriculum & Roadmap Architect</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Personalized Study Planner
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Define any learning target and receive an adaptive, realistic roadmap divided into progressive milestones and daily study tasks.
          </p>
        </div>

        {/* Create Plan Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Architect a New Learning Roadmap</span>
          </h3>

          <form onSubmit={handleGeneratePlan} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                What is your specific learning goal or exam?
              </label>
              <input
                type="text"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="e.g. Master Python Data Structures, Prepare for Distributed Systems Finals, Learn Machine Learning Math..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Level
                </label>
                <select
                  value={targetLevel}
                  onChange={e => setTargetLevel(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="beginner">Beginner (Starting from scratch)</option>
                  <option value="intermediate">Intermediate (Build working competence)</option>
                  <option value="advanced">Advanced (Deep mastery & edge cases)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Total Timeframe
                </label>
                <select
                  value={timeframeWeeks}
                  onChange={e => setTimeframeWeeks(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value={2}>2 Weeks (Intensive Sprint)</option>
                  <option value={4}>4 Weeks (Standard Month)</option>
                  <option value={8}>8 Weeks (Comprehensive Course)</option>
                  <option value={12}>12 Weeks (Full Semester)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Available Hours / Week
                </label>
                <select
                  value={hoursPerWeek}
                  onChange={e => setHoursPerWeek(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value={4}>4 Hours / Week (~35 mins/day)</option>
                  <option value={8}>8 Hours / Week (~1 hour/day)</option>
                  <option value={14}>14 Hours / Week (2 hours/day)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isGenerating || !goal.trim()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white transition shadow-sm ${
                  isGenerating || !goal.trim()
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'Structuring Curriculum Stages...' : 'Generate Personalized Roadmap'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Existing Roadmaps Switcher Tabs */}
        {plans.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-1">Your Roadmaps:</span>
            {plans.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  p.id === activePlan?.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        )}

        {/* Selected Roadmap Display */}
        {activePlan ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-7">
            {/* Plan Header & Progress Bar */}
            <div className="space-y-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {activePlan.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Goal: "{activePlan.goal}" • Timeframe: {activePlan.timeframeWeeks} Weeks • {activePlan.availableHoursPerWeek} hrs/week commitment
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeletePlan(activePlan.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Delete Roadmap"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress metric */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">
                    Roadmap Completion Progress:
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {completedTasks} of {totalTasks} Tasks Completed ({completionPercent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stages & Tasks */}
            <div className="space-y-6">
              {activePlan.stages.map((stage, sIdx) => {
                const stageDoneCount = stage.tasks.filter(t => t.completed).length;
                const isStageComplete = stageDoneCount === stage.tasks.length && stage.tasks.length > 0;

                return (
                  <div
                    key={stage.id}
                    className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                          {sIdx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {stage.title}
                        </h4>
                      </div>

                      <span className="text-[11px] font-semibold text-slate-400">
                        {stageDoneCount}/{stage.tasks.length} Completed
                      </span>
                    </div>

                    <div className="space-y-2.5 pl-2 sm:pl-8">
                      {stage.tasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleTask(activePlan.id, task.id, task.completed)}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                            task.completed
                              ? 'bg-white/80 dark:bg-slate-900/80 border-emerald-200 dark:border-emerald-900/50 text-slate-400'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                          }`}
                        >
                          <button
                            type="button"
                            className="mt-0.5 text-slate-400 hover:text-emerald-500"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className={`text-xs sm:text-sm font-semibold ${
                                  task.completed ? 'line-through opacity-70' : ''
                                }`}
                              >
                                {task.title}
                              </span>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {taskTypeIcons[task.type] || task.type}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{task.durationMinutes}m</span>
                                </span>
                              </div>
                            </div>

                            {task.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No study roadmaps created yet
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Set your target goal above to generate a customized week-by-week study roadmap with actionable tasks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
