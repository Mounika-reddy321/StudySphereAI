import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Logo } from './Logo.js';
import { api } from '../services/api.js';
import { User } from '../types/index.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('English');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email.trim(), password);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.register({
          email: email.trim(),
          password,
          name: name.trim(),
          preferredLanguage: language,
        });
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('student@studysphere.edu');
    setPassword('password123');
    setMode('login');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1b4356]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#e4f8f6] dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 border border-[#b2e8e4] dark:border-slate-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-[#4d7a8d] hover:text-[#1b4356] dark:hover:text-slate-200 rounded-lg hover:bg-[#daf4f1] dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <Logo size={40} className="justify-center" />
          <h3 className="text-xl font-extrabold text-[#1b4356] dark:text-white pt-2">
            {mode === 'login' ? 'Welcome Back to StudySphere' : 'Create Your StudySphere Account'}
          </h3>
          <p className="text-xs text-[#4d7a8d]">
            {mode === 'login'
              ? 'Sign in to access your chat history, indexed study documents, and memories.'
              : 'Start your personalized AI-driven learning journey.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-white/70 dark:bg-slate-800 p-1 mb-5 border border-[#b2e8e4]/60">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              mode === 'login'
                ? 'bg-gradient-to-r from-[#ff765e] to-[#f4624b] text-white shadow-xs'
                : 'text-[#4d7a8d] hover:text-[#1b4356]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              mode === 'register'
                ? 'bg-gradient-to-r from-[#ff765e] to-[#f4624b] text-white shadow-xs'
                : 'text-[#4d7a8d] hover:text-[#1b4356]'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#1b4356] dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#4d7a8d] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-xs text-[#1b4356] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ff765e]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1b4356] dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#4d7a8d] absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-xs text-[#1b4356] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ff765e]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1b4356] dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#4d7a8d] absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-xs text-[#1b4356] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ff765e]"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#1b4356] dark:text-slate-300 mb-1">
                Preferred Language
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-xs text-[#1b4356] dark:text-white focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Telugu">తెలుగు (Telugu)</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
                <option value="Spanish">Español (Spanish)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#ff765e] to-[#f4624b] hover:from-[#ff856f] hover:to-[#f87158] text-white transition shadow-sm disabled:opacity-50"
          >
            {isLoading
              ? 'Authenticating...'
              : mode === 'login'
              ? 'Sign In to Workspace'
              : 'Create Account & Start Learning'}
          </button>
        </form>

        {/* Demo Fast Login Shortcut */}
        <div className="mt-5 pt-4 border-t border-[#b2e8e4]/80 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-xs text-[#1b4356] dark:text-sky-400 font-bold hover:underline"
          >
            ⚡ Click here to autofill Demo Student account
          </button>
        </div>
      </div>
    </div>
  );
};
