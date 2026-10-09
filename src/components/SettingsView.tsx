import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Brain,
  Shield,
  Download,
  Trash2,
  Cpu,
  Check,
  ToggleLeft,
  ToggleRight,
  User as UserIcon,
  HelpCircle,
} from 'lucide-react';
import { User } from '../types/index.js';
import { api } from '../services/api.js';

interface SettingsViewProps {
  currentUser: User | null;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  onRefreshUser: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  selectedLanguage,
  onSelectLanguage,
  onRefreshUser,
  onLogout,
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const memoryEnabled = currentUser?.enableMemory ?? true;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await api.updateProfile({ name: name.trim() });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onRefreshUser();
    } catch (err: any) {
      alert(`Failed to update profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMemory = async () => {
    try {
      await api.updateProfile({ enableMemory: !memoryEnabled });
      onRefreshUser();
    } catch (err: any) {
      alert(`Failed to toggle memory: ${err.message}`);
    }
  };

  const handleExportData = async () => {
    try {
      const [mems, docs, convs, qzs, plans] = await Promise.all([
        api.getMemories(),
        api.getDocuments(),
        api.getConversations(),
        api.getQuizzes(),
        api.getStudyPlans(),
      ]);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        user: currentUser,
        memories: mems.memories,
        documents: docs,
        conversations: convs,
        quizzes: qzs,
        studyPlans: plans,
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studysphere-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Failed to export data: ${err.message}`);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'WARNING: This will permanently delete your account, conversations, documents, memories, and quiz history.\n\nType "DELETE" to confirm:'
    );

    if (confirmation === 'DELETE') {
      try {
        await api.deleteAccount();
        alert('Your account and all associated data have been deleted.');
        onLogout();
      } catch (err: any) {
        alert(`Deletion failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 mb-1">
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences & Data Governance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Settings & Privacy
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configure your preferred explanation language, adjust memory persistence, and manage your private data.
          </p>
        </div>

        {/* Profile Card */}
        {currentUser && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-600" />
              <span>Student Profile</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Profile saved!</span>
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Multilingual Support Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Explanation Language (Multilingual Support)</span>
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed">
            Choose your preferred language for explanations, quiz questions, and study plans. Programming code syntax and technical formulas remain standard while explanations adapt fluently.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[
              { code: 'English', title: 'English', desc: 'Standard international academic instruction' },
              { code: 'Telugu', title: 'తెలుగు (Telugu)', desc: 'తెలుగులో వివరణలు మరియు గణిత భావనలు' },
              { code: 'Hindi', title: 'हिन्दी (Hindi)', desc: 'हिन्दी में सरल और स्पष्ट अकादमिक व्याख्याएं' },
              { code: 'Spanish', title: 'Español (Spanish)', desc: 'Explicaciones académicas claras en español' },
            ].map(lang => (
              <button
                key={lang.code}
                onClick={() => onSelectLanguage(lang.code)}
                className={`p-4 rounded-2xl border text-left transition ${
                  selectedLanguage === lang.code
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500 text-indigo-950 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm">{lang.title}</span>
                  {selectedLanguage === lang.code && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">{lang.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI & Model Architecture Details */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>AI Architecture & Model Configuration</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Conversational & Reasoning Model:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                gemini-3.8-flash
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">RAG Document Embeddings:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                gemini-embedding-2-preview (with Cosine & BM25 hybrid)
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">API Execution Environment:</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                Server-Side Proxy via Node / Express (Port 3000)
              </span>
            </div>
          </div>
        </div>

        {/* Data Ownership & Account Deletion */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Data Sovereignty & Privacy Controls</span>
          </h3>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Export Learning Data Archive
              </h4>
              <p className="text-[11px] text-slate-500">
                Download a complete JSON export of all your conversations, memories, documents, and quizzes.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
            <div>
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                Delete Account & Purge All Data
              </h4>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                Permanently wipes all private study records, uploaded materials, and memories.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
