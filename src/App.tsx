import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { ChatView } from './components/ChatView.js';
import { LearningModeView } from './components/LearningModeView.js';
import { DocumentsView } from './components/DocumentsView.js';
import { MemoryView } from './components/MemoryView.js';
import { QuizView } from './components/QuizView.js';
import { PlannerView } from './components/PlannerView.js';
import { AnalyticsView } from './components/AnalyticsView.js';
import { SettingsView } from './components/SettingsView.js';
import { ResumeView } from './components/ResumeView.js';
import { PresentationView } from './components/PresentationView.js';
import { AuthModal } from './components/AuthModal.js';
import { api, getStoredToken } from './services/api.js';
import {
  ActiveTab,
  Conversation,
  ChatMessage,
  DocumentItem,
  Memory,
  User,
} from './types/index.js';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('studysphere_theme');
    return saved === 'dark';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');

  // Sidebar responsive state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Data state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Chat loading & stop generation state
  const [isChatLoading, setIsChatLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cross-view bridge props
  const [quizPrefillTopic, setQuizPrefillTopic] = useState('');
  const [quizPrefillDocId, setQuizPrefillDocId] = useState('');
  const [pptPrefillTopic, setPptPrefillTopic] = useState('');

  // Initial load
  useEffect(() => {
    initApp();
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('studysphere_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('studysphere_theme', 'light');
    }
  }, [darkMode]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const initApp = async () => {
    try {
      // 1. Check user auth or fallback to student
      const user = await api.getMe();
      setCurrentUser(user);
      if (user.preferredLanguage) setSelectedLanguage(user.preferredLanguage);

      // 2. Load conversations, documents, memories
      await Promise.all([
        refreshConversations(true),
        refreshDocuments(),
        refreshMemories(),
      ]);
    } catch (err) {
      console.warn('Initial load non-fatal warning:', err);
    }
  };

  const refreshConversations = async (autoSelectFirst = false) => {
    try {
      const convList = await api.getConversations();
      setConversations(convList);
      if (autoSelectFirst && convList.length > 0 && !activeConversationId) {
        selectConversation(convList[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const refreshDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const refreshMemories = async () => {
    try {
      const res = await api.getMemories();
      setMemories(res.memories);
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  };

  const selectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    try {
      const res = await api.getConversation(convId);
      setActiveConversation(res.conversation);
      setMessages(res.messages);
      if (res.conversation.language) {
        setSelectedLanguage(res.conversation.language);
      }
    } catch (err) {
      console.error('Failed to fetch conversation messages:', err);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(undefined);
    setActiveConversation(null);
    setMessages([]);
    setActiveTab('chat');
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await api.updateConversation(id, { title: newTitle });
      setConversations(prev =>
        prev.map(c => (c.id === id ? { ...c, title: newTitle } : c))
      );
      if (activeConversation?.id === id) {
        setActiveConversation(prev => (prev ? { ...prev, title: newTitle } : null));
      }
      showToast('Conversation renamed');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      const remaining = conversations.filter(c => c.id !== id);
      setConversations(remaining);
      if (activeConversationId === id) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
      showToast('Conversation deleted');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSendMessage = async (payload: {
    message: string;
    learningMode?: string;
    documentId?: string;
    knowledgeLevel?: string;
  }) => {
    setIsChatLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Optimistically push user message to UI
    const tempUserMsgId = `temp-u-${Date.now()}`;
    const streamingAssistantMsgId = `streaming-a-${Date.now()}`;
    
    const tempUserMsg: ChatMessage = {
      id: tempUserMsgId,
      conversationId: activeConversationId || 'pending',
      role: 'user',
      content: payload.message,
      timestamp: new Date().toISOString(),
      learningMode: payload.learningMode,
    };

    const streamingAssistantMsg: ChatMessage = {
      id: streamingAssistantMsgId,
      conversationId: activeConversationId || 'pending',
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      learningMode: payload.learningMode,
    };

    setMessages(prev => [...prev, tempUserMsg, streamingAssistantMsg]);

    let accumulatedText = '';

    try {
      await api.streamChatMessage(
        {
          conversationId: activeConversationId,
          message: payload.message,
          learningMode: payload.learningMode,
          documentId: payload.documentId,
          language: selectedLanguage,
          knowledgeLevel: payload.knowledgeLevel,
        },
        {
          onInit: data => {
            setActiveConversationId(data.conversationId);
            setActiveConversation(prev => {
              if (prev && prev.id === data.conversationId) return prev;
              return {
                id: data.conversationId,
                userId: currentUser?.id || 'usr-student-01',
                title: payload.message.slice(0, 45) + (payload.message.length > 45 ? '...' : ''),
                learningMode: (payload.learningMode as Conversation['learningMode']) || 'general',
                documentId: payload.documentId,
                language: selectedLanguage,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            });
            // Update user message id
            setMessages(prev =>
              prev.map(m => (m.id === tempUserMsgId ? data.userMessage : m))
            );
            // Non-blocking background fetch of conversation list
            api.getConversations().then(list => setConversations(list)).catch(() => {});
          },
          onChunk: chunkText => {
            accumulatedText += chunkText;
            setMessages(prev =>
              prev.map(m =>
                m.id === streamingAssistantMsgId
                  ? { ...m, content: accumulatedText }
                  : m
              )
            );
          },
          onDone: data => {
            setMessages(prev =>
              prev.map(m =>
                m.id === streamingAssistantMsgId
                  ? data.assistantMessage
                  : m
              )
            );
            // Non-blocking background refresh to update timestamps & titles
            api.getConversations().then(list => setConversations(list)).catch(() => {});
          },
          onError: err => {
            console.error('Stream error:', err);
            showToast(`Streaming issue: ${err.message}`, 'error');
          },
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // stopped by user
        return;
      }
      console.warn('Falling back to non-streaming chat request:', err);
      // Fallback to standard request
      try {
        const res = await api.sendChatMessage({
          conversationId: activeConversationId,
          message: payload.message,
          learningMode: payload.learningMode,
          documentId: payload.documentId,
          language: selectedLanguage,
          knowledgeLevel: payload.knowledgeLevel,
        });

        if (!activeConversationId || activeConversationId !== res.conversationId) {
          setActiveConversationId(res.conversationId);
          await refreshConversations();
          const convDetails = await api.getConversation(res.conversationId);
          setActiveConversation(convDetails.conversation);
        }

        setMessages(prev => {
          const filtered = prev.filter(
            m => m.id !== tempUserMsgId && m.id !== streamingAssistantMsgId
          );
          return [...filtered, res.userMessage, res.assistantMessage];
        });
      } catch (fallbackErr: any) {
        showToast(`AI generation error: ${fallbackErr.message}`, 'error');
        // Remove empty assistant message on total failure
        setMessages(prev => prev.filter(m => m.id !== streamingAssistantMsgId));
      }
    } finally {
      setIsChatLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = async () => {
    // Find latest user message
    const userMsgs = messages.filter(m => m.role === 'user');
    if (userMsgs.length === 0) return;
    const lastUserMsg = userMsgs[userMsgs.length - 1];

    await handleSendMessage({
      message: lastUserMsg.content,
      learningMode: lastUserMsg.learningMode,
      documentId: activeConversation?.documentId,
    });
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsChatLoading(false);
    showToast('Generation stopped');
  };

  const handleSaveSuggestedMemory = async (fact: string) => {
    try {
      await api.addMemory(fact, 'academic', 'Suggested by StudySphere AI');
      await refreshMemories();
      showToast('Saved to your StudySphere Memory!');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateMemoryToggle = async (enabled: boolean) => {
    try {
      const updated = await api.updateProfile({ enableMemory: enabled });
      setCurrentUser(updated);
      showToast(enabled ? 'Memory enabled' : 'Memory disabled');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Cross-Tab Bridges
  const handleStartQuizOnTopic = (topic: string) => {
    setQuizPrefillTopic(topic);
    setQuizPrefillDocId('');
    setActiveTab('quizzes');
    showToast(`Topic "${topic}" loaded in Quiz Generator!`);
  };

  const handleStartChatWithDocument = (docId: string, docTitle: string) => {
    setActiveConversationId(undefined);
    setActiveConversation(null);
    setMessages([]);
    setActiveTab('chat');
    showToast(`Grounded in "${docTitle}". Ask any question about it!`);
  };

  const handleStartQuizFromDocument = (docId: string, docTitle: string) => {
    setQuizPrefillTopic(docTitle);
    setQuizPrefillDocId(docId);
    setActiveTab('quizzes');
    showToast(`Document "${docTitle}" selected for Quiz generation!`);
  };

  const handleOpenChatWithPrompt = (prompt: string, mode: string) => {
    setActiveTab('chat');
    handleSendMessage({
      message: prompt,
      learningMode: mode,
    });
  };

  return (
    <div className={`h-screen w-screen flex overflow-hidden bg-[#cbeeee] dark:bg-slate-950 text-[#1b4356] dark:text-slate-100 font-sans selection:bg-[#1e3a8a] selection:text-white ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          api.logout();
          setCurrentUser(null);
          showToast('Logged out');
          initApp();
        }}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header Bar */}
        <Header
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Dynamic Workspace Body */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {activeTab === 'chat' && (
            <ChatView
              conversation={activeConversation}
              messages={messages}
              documents={documents}
              currentUser={currentUser}
              selectedLanguage={selectedLanguage}
              onSendMessage={handleSendMessage}
              onRegenerate={handleRegenerate}
              onSaveSuggestedMemory={handleSaveSuggestedMemory}
              onNavigateToTab={setActiveTab}
              isLoading={isChatLoading}
              onStopGeneration={handleStopGeneration}
            />
          )}

          {activeTab === 'learning-mode' && (
            <LearningModeView
              selectedLanguage={selectedLanguage}
              onStartQuizOnTopic={handleStartQuizOnTopic}
              onStartPresentationOnTopic={(topic: string) => {
                setPptPrefillTopic(topic);
                setActiveTab('ppt');
              }}
              onOpenChatWithPrompt={handleOpenChatWithPrompt}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView
              documents={documents}
              onUploadSuccess={doc => {
                setDocuments(prev => [doc, ...prev]);
                showToast(`Indexed "${doc.title}" (${doc.chunkCount} chunks)`);
              }}
              onDeleteDocument={id => {
                setDocuments(prev => prev.filter(d => d.id !== id));
                showToast('Document removed');
              }}
              onStartChatWithDocument={handleStartChatWithDocument}
              onStartQuizFromDocument={handleStartQuizFromDocument}
            />
          )}

          {activeTab === 'memories' && (
            <MemoryView
              memories={memories}
              currentUser={currentUser}
              onRefreshMemories={refreshMemories}
              onUpdateUserMemoryToggle={handleUpdateMemoryToggle}
            />
          )}

          {activeTab === 'quizzes' && (
            <QuizView
              documents={documents}
              prefilledTopic={quizPrefillTopic}
              prefilledDocId={quizPrefillDocId}
              onRefreshQuizzes={() => {}}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'resume' && (
            <ResumeView
              currentUser={currentUser}
              documents={documents}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'ppt' && (
            <PresentationView
              currentUser={currentUser}
              documents={documents}
              prefilledTopic={pptPrefillTopic}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'planner' && (
            <PlannerView
              onRefreshPlans={() => {}}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              onStartRevisionQuiz={topic => {
                setQuizPrefillTopic(topic);
                setActiveTab('quizzes');
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              selectedLanguage={selectedLanguage}
              onSelectLanguage={setSelectedLanguage}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              onRefreshUser={initApp}
              onLogout={() => {
                api.logout();
                setCurrentUser(null);
                initApp();
              }}
            />
          )}
        </main>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl border border-slate-700/50 text-xs font-semibold animate-slide-up">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 dark:text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={user => {
          setCurrentUser(user);
          showToast(`Signed in as ${user.name}`);
          initApp();
        }}
      />
    </div>
  );
}
