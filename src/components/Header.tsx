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
  Briefcase,
  Presentation,
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
  quizzes: {
    title: 'AI Quiz Generator',
    subtitle: 'Automated practice tests, grading & constructive evaluations',
    icon: HelpCircle,
  },
  resume: {
    title: 'Resume & CV Builder',
    subtitle: 'ATS-optimized professional resumes tailored to technical & academic roles',
    icon: Briefcase,
  },
  ppt: {
    title: 'PPT & Slides Generator',
    subtitle: 'Interactive seminar decks, lecture slides & spoken keynote presenter notes',
    icon: Presentation,
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
    <header className="h-16 shrink-0 border-b border-[#b2e8e4] dark:border-slate-800 bg-[#d8f4f2]/85 dark:bg-slate-900/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-10 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile menu hamburger */}
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 text-[#517c8d] hover:text-[#1b4356] dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-[#c6ece9] dark:hover:bg-slate-800 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white/90 dark:bg-slate-800 text-[#0f2b48] dark:text-sky-400 border border-[#aee3df] dark:border-slate-700 shadow-2xs hidden sm:flex">
            <Icon className="w-4 h-4 text-[#1e3a8a] dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-[#0f2b48] dark:text-white leading-tight">
              {currentTabInfo.title}
            </h1>
            <p className="hidden sm:block text-[11px] text-[#517c8d] dark:text-slate-400 font-medium">
              {currentTabInfo.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Multilingual Selector */}
        <div className="relative flex items-center bg-white/90 dark:bg-slate-800 rounded-xl px-2.5 py-1.5 border border-[#b2e8e4] dark:border-slate-700 shadow-2xs">
          <Globe className="w-3.5 h-3.5 text-[#1e3a8a] dark:text-sky-400 mr-1.5" />
          <select
            value={selectedLanguage}
            onChange={e => onSelectLanguage(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#1b4356] dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
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
          className="p-2 text-[#517c8d] hover:text-[#1b4356] dark:text-slate-300 dark:hover:text-white rounded-xl bg-white/80 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 transition border border-[#b2e8e4] dark:border-slate-700 shadow-2xs cursor-pointer flex items-center justify-center"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#1e3a8a]" />}
        </button>

        {/* User Account Button */}
        {currentUser ? (
          <div
            onClick={onOpenAuth}
            className="flex items-center gap-2 pl-1 cursor-pointer group"
            title="Account profile"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0f2b48] to-[#1e3a8a] flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-105 transition">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0f2b48] to-[#1e3a8a] hover:from-[#163b63] hover:to-[#1e40af] text-white shadow-sm shadow-blue-950/20 transition"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
