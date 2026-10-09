import React from 'react';
import {
  Menu,
  Moon,
  Sun,
  Globe,
  Sparkles,
  BookOpen,
  FileText,
  Brain,
  HelpCircle,
  Calendar,
  BarChart3,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { ActiveTab, User } from '../types/index.js';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenMobileSidebar: () => void;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
}

const TAB_METADATA: Record<ActiveTab, { title: string; subtitle: string; icon: any }> = {
  chat: {
    title: 'StudySphere Chat',
    subtitle: 'Conversational learning, reasoning & academic Q&A',
    icon: MessageSquare,
  },
  'learning-mode': {
    title: 'Personalized Learning',
    subtitle: 'Step-by-step guidance, simplification, practice & revision',
    icon: BookOpen,
  },
  documents: {
    title: 'Study Materials & RAG',
    subtitle: 'Document-grounded question answering and chapter revision',
    icon: FileText,
  },
  memories: {
    title: 'StudySphere Memory',
    subtitle: 'User-controlled facts, preferences & long-term knowledge',
    icon: Brain,
  },
  quizzes: {
    title: 'AI Quiz Generator',
    subtitle: 'Automated practice tests, grading & constructive evaluations',
    icon: HelpCircle,
  },
  planner: {
    title: 'Personalized Study Roadmap',
    subtitle: 'Adaptive curriculum, stage-by-stage milestones & task tracking',
    icon: Calendar,
  },
  analytics: {
    title: 'Progress Dashboard',
    subtitle: 'Real learning streaks, verified quiz accuracy & activity records',
    icon: BarChart3,
  },
  settings: {
    title: 'Workspace Settings',
    subtitle: 'Language preferences, data privacy & system settings',
    icon: Settings,
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  selectedLanguage,
  onSelectLanguage,
  darkMode,
  onToggleDarkMode,
  currentUser,
  onOpenAuth,
}) => {
  const currentTabInfo = TAB_METADATA[activeTab] || TAB_METADATA.chat;
  const Icon = currentTabInfo.icon;

  const languages = [
    { code: 'English', label: 'English' },
    { code: 'Telugu', label: 'తెలుగు (Telugu)' },
    { code: 'Hindi', label: 'हिन्दी (Hindi)' },
    { code: 'Spanish', label: 'Español' },
  ];

  return (
    <header className="h-16 shrink-0 border-b border-sky-100 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-10 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile menu hamburger */}
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 hidden sm:flex">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
              {currentTabInfo.title}
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-normal">
              {currentTabInfo.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Multilingual Selector */}
        <div className="relative flex items-center bg-sky-50/70 dark:bg-slate-800 rounded-xl px-2 py-1 border border-sky-200/60 dark:border-slate-700/60">
          <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 mr-1.5" />
          <select
            value={selectedLanguage}
            onChange={e => onSelectLanguage(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code} className="dark:bg-slate-900">
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 text-slate-500 hover:text-sky-700 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 transition border border-sky-200/60 dark:border-slate-800/80"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Account Button */}
        {currentUser ? (
          <div
            onClick={onOpenAuth}
            className="flex items-center gap-2 pl-1 cursor-pointer group"
            title="Account profile"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:ring-2 group-hover:ring-sky-400 transition">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
