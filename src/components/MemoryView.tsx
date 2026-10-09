import React, { useState } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  Tag,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from 'lucide-react';
import { Memory, User } from '../types/index.js';
import { api } from '../services/api.js';

interface MemoryViewProps {
  memories: Memory[];
  currentUser: User | null;
  onRefreshMemories: () => void;
  onUpdateUserMemoryToggle: (enabled: boolean) => void;
}

export const MemoryView: React.FC<MemoryViewProps> = ({
  memories,
  currentUser,
  onRefreshMemories,
  onUpdateUserMemoryToggle,
}) => {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState<Memory['category']>('preference');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFact, setEditFact] = useState('');
  const [editCategory, setEditCategory] = useState<Memory['category']>('preference');

  const memoryEnabled = currentUser?.enableMemory ?? true;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;

    try {
      await api.addMemory(newFact.trim(), newCategory);
      setNewFact('');
      setIsAdding(false);
      onRefreshMemories();
    } catch (err: any) {
      alert(`Failed to save memory: ${err.message}`);
    }
  };

  const handleStartEdit = (m: Memory) => {
    setEditingId(m.id);
    setEditFact(m.fact);
    setEditCategory(m.category);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editFact.trim()) return;
    try {
      await api.updateMemory(id, { fact: editFact.trim(), category: editCategory });
      setEditingId(null);
      onRefreshMemories();
    } catch (err: any) {
      alert(`Failed to update memory: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this stored memory?')) {
      try {
        await api.deleteMemory(id);
        onRefreshMemories();
      } catch (err: any) {
        alert(`Failed to delete memory: ${err.message}`);
      }
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete ALL stored memories? This cannot be undone.')) {
      try {
        await api.clearMemories();
        onRefreshMemories();
      } catch (err: any) {
        alert(`Failed to clear memories: ${err.message}`);
      }
    }
  };

  const filtered = memories.filter(
    m =>
      m.fact.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
  );

  const categoryBadges: Record<string, { label: string; bg: string }> = {
    preference: { label: 'Preference', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
    academic: { label: 'Academic', bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },
    goal: { label: 'Goal', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
    general: { label: 'General', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#cbeeee] dark:bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header & Memory Master Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-sky-950/70 text-[#1b4356] dark:text-sky-300 border border-[#b2e8e4] dark:border-sky-800/60 mb-2 shadow-xs">
              <Brain className="w-3.5 h-3.5 text-[#ff765e]" />
              <span>User-Controlled Long-Term Memory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1b4356] dark:text-white tracking-tight">
              StudySphere Memory
            </h2>
            <p className="text-sm text-[#4d7a8d] dark:text-slate-400">
              Personalized facts, learning preferences, and ongoing study goals that persist across sessions. You have full control to inspect, edit, or purge any item at any time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdateUserMemoryToggle(!memoryEnabled)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                memoryEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white/80 dark:bg-slate-800 border-[#b2e8e4] dark:border-slate-700 text-slate-500'
              }`}
            >
              {memoryEnabled ? (
                <>
                  <ToggleRight className="w-5 h-5 text-emerald-600" />
                  <span>Memory Enabled</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-slate-400" />
                  <span>Memory Disabled</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ff765e] to-[#f4624b] hover:from-[#ff856f] hover:to-[#f87158] text-white transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory</span>
            </button>
          </div>
        </div>

        {/* Informational Transparency Card */}
        <div className="bg-white/80 dark:bg-sky-950/30 rounded-2xl p-4 border border-[#b2e8e4] dark:border-sky-800/60 flex items-start gap-3 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-[#ff765e] shrink-0 mt-0.5" />
          <div className="text-xs text-[#1b4356] dark:text-sky-200 space-y-1">
            <strong className="font-semibold block text-[#1b4356] dark:text-white">Privacy & Transparency Guarantee:</strong>
            <p className="text-[#4d7a8d] dark:text-sky-200">
              StudySphere does not secretly record all past conversations as permanent memory. Only memories explicitly saved by you or approved via prompts are stored here. When relevant to a question, relevant memories are injected into the AI context to tailor explanations.
            </p>
          </div>
        </div>

        {/* Add Memory Form */}
        {isAdding && (
          <form
            onSubmit={handleAdd}
            className="bg-white/95 dark:bg-slate-900 rounded-3xl p-5 border border-[#b2e8e4] dark:border-slate-800 shadow-md space-y-4"
          >
            <h3 className="text-sm font-bold text-[#1b4356] dark:text-white">
              Save New Personal Learning Note / Preference
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#1b4356] dark:text-slate-300 mb-1">
                Fact or Note
              </label>
              <textarea
                value={newFact}
                onChange={e => setNewFact(e.target.value)}
                placeholder="e.g. 'I am studying for AWS Solutions Architect certification in June' or 'I prefer Python code snippets rather than C++'..."
                className="w-full px-3.5 py-2.5 bg-[#f0faf9] dark:bg-slate-800 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-xs text-[#1b4356] dark:text-white placeholder:text-[#4d7a8d]/60 focus:outline-none focus:ring-2 focus:ring-[#ff765e]"
                rows={2}
                required
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#4d7a8d]">Category:</span>
                {(['preference', 'academic', 'goal', 'general'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    className={`text-xs px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                      newCategory === cat
                        ? 'bg-gradient-to-r from-[#ff765e] to-[#f4624b] text-white'
                        : 'bg-[#daf4f1] dark:bg-slate-800 text-[#1b4356] dark:text-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#4d7a8d] hover:bg-[#daf4f1] dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#ff765e] to-[#f4624b] text-white shadow-xs"
                >
                  Save Fact
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Memory Search & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#4d7a8d] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search stored memories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-[#b2e8e4] dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff765e] text-[#1b4356] dark:text-slate-200"
            />
          </div>

          {memories.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium self-end sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Memories</span>
            </button>
          )}
        </div>

        {/* Memories List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white/95 dark:bg-slate-900 rounded-3xl p-10 border border-[#b2e8e4] dark:border-slate-800 text-center space-y-2 shadow-xs">
              <Brain className="w-10 h-10 text-[#4d7a8d]/40 mx-auto" />
              <h4 className="text-sm font-semibold text-[#1b4356] dark:text-slate-300">
                No memories found
              </h4>
              <p className="text-xs text-[#4d7a8d] max-w-sm mx-auto">
                {memories.length === 0
                  ? 'Add your learning goals and study preferences above or approve memory suggestions during AI chats.'
                  : 'No memories matched your search query.'}
              </p>
            </div>
          ) : (
            filtered.map(mem => {
              const isEditing = editingId === mem.id;
              const badge = categoryBadges[mem.category] || categoryBadges.general;

              return (
                <div
                  key={mem.id}
                  className="bg-white/95 dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-[#b2e8e4] dark:border-slate-800 shadow-xs hover:border-[#ff765e]/40 transition"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editFact}
                        onChange={e => setEditFact(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg bg-[#f0faf9] dark:bg-slate-800 border border-[#ff765e] focus:outline-none text-[#1b4356] dark:text-white"
                        rows={2}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {(['preference', 'academic', 'goal', 'general'] as const).map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setEditCategory(cat)}
                              className={`text-[10px] px-2 py-0.5 rounded capitalize font-medium ${
                                editCategory === cat
                                  ? 'bg-gradient-to-r from-[#ff765e] to-[#f4624b] text-white'
                                  : 'bg-[#daf4f1] dark:bg-slate-800 text-[#1b4356] dark:text-slate-400'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(mem.id)}
                            className="px-3 py-1 text-xs font-semibold rounded bg-gradient-to-r from-[#ff765e] to-[#f4624b] text-white"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="text-[11px] text-[#4d7a8d]">
                            Saved {new Date(mem.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#1b4356] dark:text-slate-200 leading-relaxed font-normal">
                          {mem.fact}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <button
                          onClick={() => handleStartEdit(mem)}
                          className="p-1.5 text-[#4d7a8d] hover:text-[#ff765e] rounded-lg hover:bg-[#daf4f1] dark:hover:bg-slate-800 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(mem.id)}
                          className="p-1.5 text-[#4d7a8d] hover:text-rose-600 rounded-lg hover:bg-[#daf4f1] dark:hover:bg-slate-800 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
