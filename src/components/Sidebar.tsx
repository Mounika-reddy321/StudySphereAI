import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  BookOpen,
  FileText,
  Brain,
  HelpCircle,
  Calendar,
  BarChart3,
  Settings,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  LogOut,
  Sparkles,
  Briefcase,
  Presentation,
} from 'lucide-react';
import { ActiveTab, Conversation, User } from '../types/index.js';
import { Logo } from './Logo.js';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  currentUser,
  onOpenAuth,
  onLogout,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchConv, setSearchConv] = useState('');

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchConv.toLowerCase())
  );

  const handleStartRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(c.id);
    setEditTitle(c.title);
  };

  const handleSaveRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(c.id, editTitle.trim());
    }
    setEditingConvId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(null);
  };

  const handleDelete = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(c.id);
  };

  const navItems = [
    { id: 'chat' as ActiveTab, label: 'AI Chat', icon: MessageSquare },
    { id: 'learning-mode' as ActiveTab, label: 'My Learning', icon: BookOpen },
    { id: 'quizzes' as ActiveTab, label: 'Quizzes', icon: HelpCircle },
    { id: 'resume' as ActiveTab, label: 'Resume Builder', icon: Briefcase },
    { id: 'ppt' as ActiveTab, label: 'PPT & Slides', icon: Presentation },
    { id: 'documents' as ActiveTab, label: 'Study Materials', icon: FileText },
    { id: 'planner' as ActiveTab, label: 'Study Planner', icon: Calendar },
    { id: 'memories' as ActiveTab, label: 'My Memories', icon: Brain },
    { id: 'analytics' as ActiveTab, label: 'Progress', icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#e1f7f5]/95 dark:bg-slate-900 border-r border-[#b2e8e4] dark:border-slate-800 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#b2e8e4] dark:border-slate-800/80 bg-[#d4f3f0]/80 dark:bg-slate-900">
        <Logo showText={!isCollapsed} size={34} />
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              setIsMobileOpen(false);
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
          className="p-1.5 text-[#517c8d] hover:text-[#1b4356] dark:hover:text-slate-200 rounded-lg hover:bg-[#c6ece9] dark:hover:bg-slate-800 transition"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* New Chat Primary Action */}
      <div className="p-3">
        <button
          onClick={() => {
            onNewChat();
            if (window.innerWidth < 768) setIsMobileOpen(false);
          }}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-2xl font-bold text-sm transition-all shadow-md ${
            isCollapsed
              ? 'bg-gradient-to-r from-[#0f2b48] to-[#1e3a8a] text-white shadow-blue-950/20'
              : 'bg-gradient-to-r from-[#0f2b48] to-[#1e3a8a] hover:from-[#163b63] hover:to-[#1e40af] text-white shadow-blue-950/25 hover:shadow-lg hover:-translate-y-0.5'
          }`}
          title="Start a fresh learning session"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          {!isCollapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="px-2 py-1 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 768) setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-[#0f2b48] dark:text-white shadow-xs border border-[#a6e2de] dark:border-slate-700'
                  : 'text-[#416f82] dark:text-slate-400 hover:bg-[#d0f1ee]/80 dark:hover:bg-slate-800/60 hover:text-[#0f2b48] dark:hover:text-slate-200'
              }`}
              title={item.label}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1e3a8a] dark:text-sky-400' : ''}`} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Chat History Section (visible when not collapsed) */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0 mt-3 pt-3 border-t border-[#b2e8e4] dark:border-slate-800">
          <div className="px-3.5 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#517c8d] dark:text-slate-500">
              Recent Chats
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#c8eeeb] dark:bg-slate-800 text-[#1b4356] dark:text-slate-300 font-bold">
              {conversations.length}
            </span>
          </div>

          {/* Quick search inside chats if > 3 */}
          {conversations.length > 3 && (
            <div className="px-3 mb-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#517c8d] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchConv}
                  onChange={e => setSearchConv(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white/90 dark:bg-slate-800/80 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-[#1b4356] dark:text-slate-200 placeholder:text-[#517c8d]/70 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30 focus:border-[#1e3a8a]"
                />
              </div>
            </div>
          )}

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-6 px-3">
                <MessageSquare className="w-6 h-6 mx-auto text-[#79a9bb] dark:text-slate-600 mb-1" />
                <p className="text-xs text-[#517c8d]">No chat history found</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = activeConversationId === conv.id && activeTab === 'chat';
                const isEditing = editingConvId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      setActiveTab('chat');
                      if (window.innerWidth < 768) setIsMobileOpen(false);
                    }}
                    className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 text-[#1b4356] dark:text-white font-semibold border border-[#a6e2de] dark:border-slate-700 shadow-2xs'
                        : 'text-[#416f82] dark:text-slate-400 hover:bg-[#d0f1ee]/70 dark:hover:bg-slate-800/40 hover:text-[#1b4356] dark:hover:text-slate-200'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 text-xs px-2 py-1 border border-[#1e3a8a] rounded-lg focus:outline-none text-[#1b4356]"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveRename(conv, e as any);
                            if (e.key === 'Escape') setEditingConvId(null);
                          }}
                        />
                        <button
                          onClick={e => handleSaveRename(conv, e)}
                          className="p-1 hover:text-emerald-500 text-[#517c8d]"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="p-1 hover:text-rose-500 text-[#517c8d]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-80 text-[#308197] dark:text-sky-400" />
                          <span className="truncate">{conv.title}</span>
                        </div>

                        <div className="hidden group-hover:flex items-center gap-1 shrink-0 bg-inherit pl-1">
                          <button
                            onClick={e => handleStartRename(conv, e)}
                            className="p-1 text-[#517c8d] hover:text-[#1b4356] dark:hover:text-sky-400 rounded transition"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={e => handleDelete(conv, e)}
                            className="p-1 text-[#517c8d] hover:text-rose-600 dark:hover:text-rose-400 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* User Profile Footer */}
      <div className="p-3 border-t border-[#b2e8e4] dark:border-slate-800 bg-[#d8f4f2]/70 dark:bg-slate-900/50">
        {currentUser ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {currentUser.email}
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            <UserIcon className="w-4 h-4" />
            {!isCollapsed && <span>Sign In / Profile</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-72'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
