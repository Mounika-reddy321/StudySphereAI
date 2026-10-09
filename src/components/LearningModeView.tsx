import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  Target,
  Layers,
  ArrowRight,
  HelpCircle,
  RotateCcw,
  BookMarked,
  Flame,
  Check,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer.js';
import { api } from '../services/api.js';

interface LearningModeViewProps {
  selectedLanguage: string;
  onStartQuizOnTopic: (topic: string) => void;
  onOpenChatWithPrompt: (prompt: string, mode: string) => void;
}

export const LearningModeView: React.FC<LearningModeViewProps> = ({
  selectedLanguage,
  onStartQuizOnTopic,
  onOpenChatWithPrompt,
}) => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [goal, setGoal] = useState('Deep understanding & problem solving');
  const [studyTime, setStudyTime] = useState('30 minutes');
  const [activeMode, setActiveMode] = useState<
    'step-by-step' | 'explain-simply' | 'practice' | 'revise' | 'test-me'
  >('step-by-step');

  const [isLoading, setIsLoading] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const modes = [
    {
      id: 'step-by-step',
      title: 'Step-by-Step Lesson',
      subtitle: 'Build progressive mental models from foundations to mastery',
      icon: Layers,
      badge: 'Deep Dive',
    },
    {
      id: 'explain-simply',
      title: 'Explain Simply (Feynman)',
      subtitle: 'Demystify complex ideas with analogies and zero jargon',
      icon: Sparkles,
      badge: 'Intuitive',
    },
    {
      id: 'practice',
      title: 'Practice & Exercises',
      subtitle: 'Hands-on problems with progressive hints and solutions',
      icon: Target,
      badge: 'Applied',
    },
    {
      id: 'revise',
      title: 'Quick Revision Sheet',
      subtitle: 'High-impact formulas, cheat-sheets, and flashcard points',
      icon: RotateCcw,
      badge: 'High-Yield',
    },
    {
      id: 'test-me',
      title: 'Interactive Knowledge Check',
      subtitle: 'Diagnostic questions to identify and resolve blindspots',
      icon: HelpCircle,
      badge: 'Diagnostic',
    },
  ];

  const handleGenerateLesson = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setGeneratedLesson(null);
    setIsCompleted(false);

    try {
      const modeObj = modes.find(m => m.id === activeMode);
      const prompt = `You are StudySphere Personal Learning Coach.
Create an exhaustive, structured learning guide on the topic: "${topic.trim()}"
Current Student Level: ${level}
Learning Goal: ${goal}
Available Study Time: ${studyTime}
Explanation Language: ${selectedLanguage}
Learning Mode: ${modeObj?.title}

Requirements:
- Begin with an intuitive 2-sentence executive summary.
- Provide step-by-step progressive sections with clean Markdown headings and lists.
- Include real-world analogies, formal definitions, and LaTeX mathematical formulas or code snippets if applicable.
- Conclude with 2 Practice Questions or Knowledge-Check prompts.
- Recommend 3 Suggested Next Topics for continuous mastery.`;

      const res = await api.sendChatMessage({
        message: prompt,
        learningMode: activeMode,
        knowledgeLevel: level,
        language: selectedLanguage,
      });

      setGeneratedLesson(res.assistantMessage.content);
    } catch (err: any) {
      alert(`Lesson generation failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleTopics = [
    'Convolutional Neural Networks',
    'Virtual Memory & Page Replacement',
    'Bayesian Statistics & Priors',
    'Dynamic Programming: Knapsack Problem',
    'Distributed Consensus (Raft & Paxos)',
    'CRISPR-Cas9 Gene Editing Mechanics',
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#cbeeee] dark:bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/80 dark:bg-sky-950/70 text-[#1b4356] dark:text-sky-300 border border-[#b2e8e4] dark:border-sky-800/60 shadow-2xs">
            <BookMarked className="w-3.5 h-3.5 text-[#ff765e]" />
            <span>Dedicated Structured Learning Studio</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1b4356] dark:text-white tracking-tight">
            Personalized Learning Mode
          </h2>
          <p className="text-sm text-[#517c8d] dark:text-slate-400 font-medium">
            Tailor high-fidelity academic lessons adapted to your current skill level, study timeframe, and pedagogical goals.
          </p>
        </div>

        {/* Learning Mode Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {modes.map(m => {
            const Icon = m.icon;
            const isSelected = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id as any)}
                className={`p-3.5 rounded-3xl border text-left transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-[#ff765e] shadow-md ring-2 ring-[#ff765e]/25'
                    : 'bg-white/85 dark:bg-slate-900/60 border-[#b2e8e4] dark:border-slate-800 hover:border-[#ff765e]/60 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-2xl ${
                      isSelected
                        ? 'bg-gradient-to-tr from-[#ff765e] to-[#f4624b] text-white shadow-xs'
                        : 'bg-[#daf4f1] dark:bg-slate-800 text-[#1b4356] dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#d0f2ee] dark:bg-slate-800 text-[#1b4356]">
                    {m.badge}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#1b4356] dark:text-white leading-tight">
                  {m.title}
                </h4>
                <p className="text-[11px] text-[#517c8d] dark:text-slate-400 mt-1 line-clamp-2">
                  {m.subtitle}
                </p>
              </button>
            );
          })}
        </div>

        {/* Configuration Card */}
        <div className="bg-white/95 dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-[#b2e8e4] dark:border-slate-800/80 shadow-sm space-y-6">
          <form onSubmit={handleGenerateLesson} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1b4356] dark:text-slate-300 mb-2">
                What Subject or Topic do you want to learn?
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Backpropagation, Quantum Computing, Microeconomics, Calculus Integrals..."
                className="w-full px-4 py-3.5 bg-[#f2fbfa] dark:bg-slate-800/90 border-2 border-[#b2e8e4] focus:border-[#ff765e] rounded-2xl text-sm text-[#1b4356] dark:text-white placeholder:text-[#517c8d]/60 focus:outline-none focus:ring-4 focus:ring-[#ff765e]/15 transition"
              />

              {/* Sample Topic Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[11px] font-bold text-[#517c8d] mr-1">Popular:</span>
                {sampleTopics.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-[#daf4f1] dark:bg-slate-800 text-[#1b4356] dark:text-slate-300 hover:bg-[#c6eee9] hover:text-[#1b4356] border border-[#b2e8e4] transition"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1b4356] dark:text-slate-300 mb-1.5">
                  Knowledge Level
                </label>
                <select
                  value={level}
                  onChange={e => setLevel(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-[#f2fbfa] dark:bg-slate-800 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-xs font-bold text-[#1b4356] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff765e]/30"
                >
                  <option value="Beginner">Beginner (Foundations & Basics)</option>
                  <option value="Intermediate">Intermediate (Core Concepts & Mechanics)</option>
                  <option value="Advanced">Advanced (Rigorous Proofs & Edge Cases)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b4356] dark:text-slate-300 mb-1.5">
                  Available Study Time
                </label>
                <select
                  value={studyTime}
                  onChange={e => setStudyTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f2fbfa] dark:bg-slate-800 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-xs font-bold text-[#1b4356] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff765e]/30"
                >
                  <option value="15 minutes">15 minutes (Quick Sprint)</option>
                  <option value="30 minutes">30 minutes (Standard Focus)</option>
                  <option value="1 hour">1 hour (Comprehensive Immersion)</option>
                  <option value="2 hours">2 hours (Deep Academic Workshop)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b4356] dark:text-slate-300 mb-1.5">
                  Primary Learning Goal
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  placeholder="e.g. Exam prep, interview, project"
                  className="w-full px-3 py-2.5 bg-[#f2fbfa] dark:bg-slate-800 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-xs font-medium text-[#1b4356] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff765e]/30"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading || !topic.trim()}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-md ${
                  isLoading || !topic.trim()
                    ? 'bg-[#ccefe8] text-[#517c8d]/60 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#ff765e] to-[#f4624b] hover:from-[#f8674f] hover:to-[#e65239] text-white shadow-[#f4624b]/25 hover:scale-105'
                }`}
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>{isLoading ? 'Synthesizing Lesson...' : 'Generate Learning Experience'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-sky-100 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-sky-600 border-t-transparent animate-spin mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Structuring your {level}-level lesson on "{topic}"...
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Calibrating explanations, constructing analogies, and organizing practice checks in {selectedLanguage}.
            </p>
          </div>
        )}

        {/* Generated Lesson Content */}
        {generatedLesson && !isLoading && (
          <div className="bg-white/95 dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-[#b2e8e4] dark:border-slate-800/80 shadow-md space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#b2e8e4]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-[#daf4f1] text-[#ff765e] border border-[#b2e8e4]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#1b4356] dark:text-white">
                    {topic}
                  </h3>
                  <span className="text-xs text-[#517c8d]">
                    Mode: {modes.find(m => m.id === activeMode)?.title} • Level: {level}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCompleted(!isCompleted)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#daf4f1] text-[#1b4356] hover:bg-[#cbf0ea] border border-[#b2e8e4]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isCompleted ? 'Marked as Completed' : 'Mark as Completed'}</span>
                </button>

                <button
                  onClick={() => onStartQuizOnTopic(topic)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#daf4f1] text-[#1b4356] hover:bg-[#cbf0ea] border border-[#b2e8e4] transition"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#ff765e]" />
                  <span>Take Quiz On This</span>
                </button>
              </div>
            </div>

            {/* Markdown Lesson Content */}
            <div className="pt-2 text-[#1b4356]">
              <MarkdownRenderer content={generatedLesson} />
            </div>

            {/* Footer Next Steps */}
            <div className="mt-8 pt-5 border-t border-[#b2e8e4] flex flex-wrap items-center justify-between gap-3 bg-[#e2f7f5]/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-[#b2e8e4] dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-[#1b4356] dark:text-white">
                  Have doubts about this topic?
                </h4>
                <p className="text-[11px] text-[#517c8d]">
                  Continue this lesson with conversational multi-turn AI in StudySphere Chat.
                </p>
              </div>
              <button
                onClick={() =>
                  onOpenChatWithPrompt(
                    `I just studied the lesson on "${topic}". Can we discuss its practical applications and solve a sample problem together?`,
                    activeMode
                  )
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ff765e] to-[#f4624b] text-white transition shadow-sm hover:scale-105"
              >
                <span>Continue Discussion in Chat</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
