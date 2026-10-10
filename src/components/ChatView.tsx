import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sparkles,
  Paperclip,
  BookOpen,
  HelpCircle,
  Calendar,
  FileText,
  RotateCcw,
  Edit3,
  Copy,
  Check,
  Brain,
  ExternalLink,
  ChevronDown,
  Info,
  X,
} from 'lucide-react';
import { ChatMessage, Conversation, DocumentItem, User } from '../types/index.js';
import { MarkdownRenderer } from './MarkdownRenderer.js';

interface ChatViewProps {
  conversation: Conversation | null;
  messages: ChatMessage[];
  documents: DocumentItem[];
  currentUser: User | null;
  selectedLanguage: string;
  onSendMessage: (payload: {
    message: string;
    learningMode?: string;
    documentId?: string;
    knowledgeLevel?: string;
  }) => Promise<void>;
  onRegenerate: () => Promise<void>;
  onSaveSuggestedMemory: (fact: string) => Promise<void>;
  onNavigateToTab: (tab: any) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  messages,
  documents,
  currentUser,
  selectedLanguage,
  onSendMessage,
  onRegenerate,
  onSaveSuggestedMemory,
  onNavigateToTab,
  isLoading,
  onStopGeneration,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [learningMode, setLearningMode] = useState<string>('general');
  const [knowledgeLevel, setKnowledgeLevel] = useState<string>('Intermediate');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState('');
  const [previewCitation, setPreviewCitation] = useState<{ documentTitle: string; snippet: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (conversation?.documentId) {
      setSelectedDocId(conversation.documentId);
    }
    if (conversation?.learningMode) {
      setLearningMode(conversation.learningMode);
    }
  }, [conversation]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const msg = inputText.trim();
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage({
      message: msg,
      learningMode,
      documentId: selectedDocId || undefined,
      knowledgeLevel,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // auto resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditInputText(msg.content);
  };

  const handleSaveEdit = async () => {
    if (!editInputText.trim() || isLoading) return;
    const newText = editInputText.trim();
    setEditingMessageId(null);
    await onSendMessage({
      message: newText,
      learningMode,
      documentId: selectedDocId || undefined,
      knowledgeLevel,
    });
  };

  const suggestedPrompts = [
    {
      title: 'Neural Networks & Deep Learning',
      desc: 'Explain Backpropagation with an intuitive real-world analogy and formulas',
    },
    {
      title: 'Operating Systems & Memory',
      desc: 'How does virtual memory paging work and what causes page faults?',
    },
    {
      title: 'Algorithm Design',
      desc: "Implement Dijkstra's shortest path algorithm in Python with time complexity analysis",
    },
    {
      title: 'Database Architecture',
      desc: 'Compare Relational SQL vs NoSQL document stores with practical trade-offs',
    },
  ];

  const quickFeatures = [
    {
      id: 'learning-mode',
      title: 'Personalized Learning',
      desc: 'Step-by-step guided lessons, Feynman simplification, and practice sets',
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'documents',
      title: 'Chat With Study Material',
      desc: 'Upload lecture slides or textbook PDFs for grounded citations and summaries',
      icon: FileText,
      color: 'from-indigo-500 to-violet-600',
    },
    {
      id: 'quizzes',
      title: 'Generate Practice Quiz',
      desc: 'Instant diagnostic MCQs and AI-evaluated short answer practice tests',
      icon: HelpCircle,
      color: 'from-violet-500 to-purple-600',
    },
    {
      id: 'planner',
      title: 'Personal Study Roadmap',
      desc: 'Adaptive multi-week curriculum broken into actionable daily milestones',
      icon: Calendar,
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#cbeeee] dark:bg-slate-950 overflow-hidden relative">
      {/* Top Banner if Document is linked */}
      {selectedDocId && (
        <div className="bg-[#daf4f1] dark:bg-sky-950/60 border-b border-[#b2e8e4] dark:border-sky-800/60 px-4 py-2 flex items-center justify-between text-xs text-[#1b4356] dark:text-sky-200 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0" />
            <span>
              Grounded in study material:{' '}
              <strong className="font-bold">
                {documents.find(d => d.id === selectedDocId)?.title || 'Selected Document'}
              </strong>
            </span>
          </div>
          <button
            onClick={() => setSelectedDocId('')}
            className="p-1 hover:text-[#1e3a8a] text-[#517c8d] ml-2"
            title="Detach document"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          // Welcome Screen
          <div className="max-w-3xl mx-auto py-8">
            <div className="text-center space-y-3 mb-10">
              <div className="inline-flex p-3 rounded-2xl bg-white/80 dark:bg-slate-900 border border-[#b2e8e4] dark:border-sky-800/50 mb-2 shadow-xs">
                <Sparkles className="w-7 h-7 text-[#1e3a8a] animate-pulse" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f2b48] dark:text-white tracking-tight">
                Welcome to StudySphere
              </h2>
              <p className="text-sm sm:text-base text-[#517c8d] dark:text-slate-400 max-w-xl mx-auto font-medium">
                What would you like to learn today? Chat about academic concepts, upload study materials for RAG-grounded answers, or take custom quizzes.
              </p>
            </div>

            {/* Quick-Access Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-10">
              {quickFeatures.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => onNavigateToTab(item.id)}
                    className="group p-4 rounded-3xl bg-white/90 dark:bg-slate-900 border border-[#b2e8e4] dark:border-slate-800/80 hover:border-[#1e3a8a] dark:hover:border-sky-500 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start gap-3.5"
                  >
                    <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#0f2b48] to-[#1e3a8a] text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1b4356] dark:text-white group-hover:text-[#1e3a8a] dark:group-hover:text-sky-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#517c8d] dark:text-slate-400 mt-0.5 line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Suggested Academic Prompts */}
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-[#517c8d] dark:text-slate-500 block mb-3">
                Suggested Prompts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(p.desc);
                      textareaRef.current?.focus();
                    }}
                    className="text-left p-4 rounded-2xl bg-white/90 dark:bg-slate-900 border border-[#b2e8e4] dark:border-slate-800 hover:bg-white hover:border-[#1e3a8a]/60 transition-all group shadow-2xs"
                  >
                    <span className="text-xs font-bold text-[#1b4356] dark:text-sky-400 block group-hover:text-[#1e3a8a]">
                      {p.title}
                    </span>
                    <span className="text-xs text-[#517c8d] dark:text-slate-300 line-clamp-2 mt-1">
                      {p.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Active Conversation Messages
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isLastUser = isUser && index === messages.length - 2;
              const isLastAssistant = !isUser && index === messages.length - 1;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-bold text-[#517c8d] dark:text-slate-400">
                      {isUser ? (currentUser?.name || 'You') : 'StudySphere AI'}
                    </span>
                    {msg.learningMode && msg.learningMode !== 'general' && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-sky-950 text-[#1b4356] dark:text-sky-400 border border-[#b2e8e4] dark:border-sky-800/50">
                        {msg.learningMode}
                      </span>
                    )}
                  </div>

                  <div
                    className={`relative group rounded-3xl p-4 sm:p-5 max-w-[92%] sm:max-w-[85%] shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-[#0f2b48] to-[#1e3a8a] text-white rounded-tr-xs shadow-blue-950/20 font-medium'
                        : 'bg-white dark:bg-slate-900 border border-[#b2e8e4] dark:border-slate-800/80 text-[#1b4356] dark:text-slate-100 rounded-tl-xs'
                    }`}
                  >
                    {editingMessageId === msg.id ? (
                      <div className="space-y-2 w-full min-w-[280px]">
                        <textarea
                          value={editInputText}
                          onChange={e => setEditInputText(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl bg-white/20 text-white placeholder-white/70 border border-white/50 focus:outline-none"
                          rows={3}
                        />
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-2.5 py-1 rounded-lg bg-black/20 text-white hover:bg-black/30"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-1 rounded-lg bg-white text-[#1e3a8a] font-bold hover:bg-slate-100"
                          >
                            Resubmit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {isUser ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <MarkdownRenderer content={msg.content} />
                        )}

                        {/* Citations Pill from Document RAG */}
                        {msg.documentCitations && msg.documentCitations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#b2e8e4]/60 dark:border-slate-800/80">
                            <span className="text-[11px] font-bold text-[#517c8d] dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                              Document Sources & Grounding:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.documentCitations.map((cit, cIdx) => (
                                <button
                                  key={cIdx}
                                  onClick={() =>
                                    setPreviewCitation({
                                      documentTitle: cit.documentTitle,
                                      snippet: cit.snippet,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs bg-[#e2f7f5] dark:bg-sky-950/60 hover:bg-[#d0f2ee] dark:hover:bg-sky-900/60 text-[#1b4356] dark:text-sky-300 border border-[#b2e8e4] dark:border-sky-800/60 transition"
                                >
                                  <FileText className="w-3 h-3 text-[#1e3a8a]" />
                                  <span className="font-semibold truncate max-w-[180px]">
                                    {cit.documentTitle} (Chunk #{cit.chunkIndex})
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* StudySphere Memory Suggestion Trigger */}
                        {msg.memorySuggestion && (
                          <div className="mt-3.5 p-3 rounded-2xl bg-[#e2f7f5] dark:bg-sky-950/50 border border-[#b2e8e4] dark:border-sky-800/60 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <Brain className="w-4 h-4 text-[#1e3a8a] shrink-0 mt-0.5" />
                              <div>
                                <span className="text-xs font-bold text-[#1b4356] dark:text-sky-200">
                                  StudySphere Memory Suggestion
                                </span>
                                <p className="text-xs text-[#517c8d] dark:text-sky-300 mt-0.5">
                                  "{msg.memorySuggestion}"
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => onSaveSuggestedMemory(msg.memorySuggestion!)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0f2b48] to-[#1e3a8a] text-white transition shadow-sm hover:shadow"
                              >
                                Remember This
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions Bar underneath message */}
                  <div className="flex items-center gap-2 mt-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#517c8d] text-xs">
                    {isUser && !editingMessageId && (
                      <button
                        onClick={() => handleStartEdit(msg)}
                        className="flex items-center gap-1 hover:text-[#1b4356] dark:hover:text-slate-200"
                        title="Edit and resubmit"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    {!isUser && isLastAssistant && (
                      <button
                        onClick={onRegenerate}
                        disabled={isLoading}
                        className="flex items-center gap-1 hover:text-[#1e3a8a] dark:hover:text-sky-400 transition font-semibold"
                        title="Regenerate response"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex flex-col items-start space-y-1">
                <span className="text-[11px] font-bold text-[#517c8d] px-1">
                  StudySphere AI is thinking...
                </span>
                <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-[#b2e8e4] dark:border-slate-800 flex items-center gap-2.5 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a] animate-bounce" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a] animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a] animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-[#517c8d] dark:text-slate-400 font-semibold pl-1">
                    Analyzing concepts & formulating explanation...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Citation Preview Modal */}
      {previewCitation && (
        <div className="fixed inset-0 z-50 bg-[#1b4356]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-[#b2e8e4] dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#b2e8e4] dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ff765e]" />
                <h4 className="text-sm font-bold text-[#1b4356] dark:text-white truncate">
                  {previewCitation.documentTitle}
                </h4>
              </div>
              <button
                onClick={() => setPreviewCitation(null)}
                className="text-[#517c8d] hover:text-[#1b4356] dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-[#1b4356] dark:text-slate-300 bg-[#eefaf9] dark:bg-slate-800/60 p-4 rounded-2xl border border-[#b2e8e4] dark:border-slate-700/60 max-h-60 overflow-y-auto leading-relaxed">
              "{previewCitation.snippet}"
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setPreviewCitation(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#daf4f1] hover:bg-[#c7eee9] text-[#1b4356] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Box Bottom Container */}
      <div className="p-4 sm:p-5 border-t border-[#b2e8e4] dark:border-slate-800/80 bg-[#d8f4f2]/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0">
        <div className="max-w-3xl mx-auto space-y-2.5">
          {/* Controls Bar: Learning Mode & Document Attachment & Level */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Learning Mode selector */}
              <div className="flex items-center bg-white/90 dark:bg-slate-800 rounded-xl px-2.5 py-1.5 border border-[#b2e8e4] dark:border-slate-700/60 shadow-2xs">
                <BookOpen className="w-3.5 h-3.5 text-[#ff765e] mr-1.5" />
                <span className="text-[11px] font-bold text-[#517c8d] mr-1">Mode:</span>
                <select
                  value={learningMode}
                  onChange={e => setLearningMode(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#1b4356] dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="general" className="dark:bg-slate-900">General Q&A</option>
                  <option value="step-by-step" className="dark:bg-slate-900">Step-by-Step</option>
                  <option value="explain-simply" className="dark:bg-slate-900">Explain Simply (Feynman)</option>
                  <option value="practice" className="dark:bg-slate-900">Practice & Exercises</option>
                  <option value="revise" className="dark:bg-slate-900">Quick Revision</option>
                  <option value="test-me" className="dark:bg-slate-900">Test Me (Knowledge Check)</option>
                </select>
              </div>

              {/* Grounding Document selector */}
              {documents.length > 0 && (
                <div className="flex items-center bg-white/90 dark:bg-slate-800 rounded-xl px-2.5 py-1.5 border border-[#b2e8e4] dark:border-slate-700/60 shadow-2xs">
                  <FileText className="w-3.5 h-3.5 text-[#308197] mr-1.5" />
                  <span className="text-[11px] font-bold text-[#517c8d] mr-1">Doc:</span>
                  <select
                    value={selectedDocId}
                    onChange={e => setSelectedDocId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[#1b4356] dark:text-slate-200 focus:outline-none cursor-pointer max-w-[140px] truncate"
                  >
                    <option value="" className="dark:bg-slate-900">All / None</option>
                    {documents.map(d => (
                      <option key={d.id} value={d.id} className="dark:bg-slate-900">
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Knowledge Level */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#517c8d]">Level:</span>
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setKnowledgeLevel(lvl)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition shadow-2xs ${
                    knowledgeLevel === lvl
                      ? 'bg-gradient-to-r from-[#ff765e] to-[#f4624b] text-white shadow-[#f4624b]/20'
                      : 'bg-white/80 dark:bg-slate-800 text-[#517c8d] hover:bg-white border border-[#b2e8e4]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Large Conversational Input Box */}
          <form onSubmit={handleSubmit} className="relative flex items-end">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, request an explanation, or upload study notes... (Shift+Enter for newline)"
              className="w-full pl-4 pr-24 py-3.5 bg-white dark:bg-slate-800/90 border-2 border-[#b2e8e4] focus:border-[#ff765e] rounded-2xl text-sm text-[#1b4356] dark:text-white placeholder:text-[#517c8d]/60 focus:outline-none focus:ring-4 focus:ring-[#ff765e]/15 resize-none transition shadow-sm leading-relaxed max-h-48"
            />

            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
              {isLoading && onStopGeneration ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
                  title="Stop generation"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`p-2.5 rounded-xl transition shadow-md ${
                    inputText.trim()
                      ? 'bg-gradient-to-r from-[#ff765e] to-[#f4624b] hover:from-[#f8674f] hover:to-[#e65239] text-white shadow-[#f4624b]/25 hover:scale-105'
                      : 'bg-[#bfeae6] dark:bg-slate-700 text-[#517c8d]/60 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center justify-between text-[11px] text-[#517c8d] px-1 font-medium">
            <span>Powered by Gemini & StudySphere Grounding</span>
            <span>Responses adapted to {knowledgeLevel} • {selectedLanguage}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
