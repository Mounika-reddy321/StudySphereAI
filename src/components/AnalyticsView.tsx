import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Flame,
  Award,
  CheckCircle2,
  BookOpen,
  FileText,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Calendar,
  Layers,
} from 'lucide-react';
import { AnalyticsData } from '../types/index.js';
import { api } from '../services/api.js';

interface AnalyticsViewProps {
  onStartRevisionQuiz: (topic: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onStartRevisionQuiz }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Calculating your learning metrics...</p>
        </div>
      </div>
    );
  }

  const { metrics, distinctTopics, revisionAreas, recentActivities, aiRecommendation, recentQuizScores } = data;

  const statCards = [
    {
      label: 'Learning Streak',
      value: `${metrics.streakDays} Days`,
      desc: 'Based on actual daily records',
      icon: Flame,
      color: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Quiz Average',
      value: `${metrics.avgQuizScore}%`,
      desc: `${metrics.totalQuizAttempts} total quiz attempts`,
      icon: Award,
      color: 'from-indigo-500 to-blue-600',
    },
    {
      label: 'Tasks Completed',
      value: `${metrics.completedTasks} / ${metrics.totalTasks}`,
      desc: `${metrics.taskCompletionRate}% roadmap completion`,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Study Time',
      value: `${metrics.totalStudyHours} hrs`,
      desc: `${metrics.conversationsCount} chat sessions held`,
      icon: Clock,
      color: 'from-violet-500 to-purple-600',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#cbeeee] dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/80 dark:bg-indigo-950/70 text-[#1b4356] dark:text-indigo-300 border border-[#b2e8e4] dark:border-indigo-800/60 mb-1 shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5 text-[#ff765e]" />
            <span>Verified Learning Analytics</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1b4356] dark:text-white tracking-tight">
            Progress & Performance Dashboard
          </h2>
          <p className="text-sm text-[#517c8d] dark:text-slate-400 font-medium">
            Real metrics calculated strictly from your completed lessons, practice quiz evaluations, and roadmap tasks.
          </p>
        </div>

        {/* 4 Core Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                className="bg-white/95 dark:bg-slate-900 rounded-3xl p-5 border border-[#b2e8e4] dark:border-slate-800 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#517c8d] uppercase tracking-wider">
                    {st.label}
                  </span>
                  <div className={`p-2.5 rounded-2xl bg-gradient-to-tr ${st.color} text-white shadow-xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-[#1b4356] dark:text-white">
                    {st.value}
                  </h3>
                  <p className="text-[11px] text-[#517c8d] mt-0.5 font-medium">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Smart Next Steps Recommendation */}
        {aiRecommendation && (
          <div className="bg-white/95 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-violet-950/40 rounded-3xl p-6 border border-[#b2e8e4] dark:border-indigo-800/80 shadow-xs flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#ff765e] to-[#f4624b] text-white shrink-0 shadow-sm mt-0.5">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-[#1b4356] dark:text-white">
                Personalized Learning Insight & Recommendations:
              </h4>
              <p className="text-xs text-[#1b4356] dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                {aiRecommendation}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Topics Studied & Areas for Revision */}
          <div className="space-y-6">
            {/* Distinct Topics */}
            <div className="bg-white/95 dark:bg-slate-900 rounded-3xl p-6 border border-[#b2e8e4] dark:border-slate-800 space-y-4 shadow-2xs">
              <h3 className="text-sm font-bold text-[#1b4356] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#ff765e]" />
                <span>Topics Explored ({distinctTopics.length})</span>
              </h3>

              <div className="flex flex-wrap gap-2">
                {distinctTopics.length === 0 ? (
                  <p className="text-xs text-[#517c8d]">No topics explored yet.</p>
                ) : (
                  distinctTopics.map((top, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#daf4f1] text-[#1b4356] border border-[#b2e8e4]"
                    >
                      {top}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Areas Needing Revision */}
            <div className="bg-white/95 dark:bg-slate-900 rounded-3xl p-6 border border-[#b2e8e4] dark:border-slate-800 space-y-4 shadow-2xs">
              <h3 className="text-sm font-bold text-[#1b4356] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Identified Knowledge Gaps for Revision</span>
              </h3>

              {revisionAreas.length === 0 ? (
                <p className="text-xs text-[#517c8d]">
                  No weak spots identified! All recent quiz questions were answered with high accuracy.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {revisionAreas.map((rev, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 text-xs"
                    >
                      <span className="text-amber-900 dark:text-amber-200 font-bold">
                        {rev}
                      </span>
                      <button
                        onClick={() => onStartRevisionQuiz(rev)}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#ff765e] to-[#f4624b] text-white font-bold"
                      >
                        Practice
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white/95 dark:bg-slate-900 rounded-3xl p-6 border border-[#b2e8e4] dark:border-slate-800 space-y-4 shadow-2xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1b4356] dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[#ff765e]" />
                <span>Recent Learning Activity Log</span>
              </h3>

              {recentActivities.length === 0 ? (
                <p className="text-xs text-[#517c8d]">No activity recorded yet.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {recentActivities.map(act => (
                    <div
                      key={act.id}
                      className="flex items-start gap-3 text-xs pb-2.5 border-b border-[#b2e8e4]/60 dark:border-slate-800/80"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#ff765e] mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1b4356] dark:text-slate-200 font-bold">
                          {act.details}
                        </p>
                        <span className="text-[10px] text-[#517c8d]">
                          {new Date(act.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
