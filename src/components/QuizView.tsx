import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ChevronRight,
  ChevronLeft,
  FileText,
  BarChart2,
  History,
  AlertCircle,
  Play,
} from 'lucide-react';
import { DocumentItem, Quiz, QuizAttempt, QuizQuestion } from '../types/index.js';
import { api } from '../services/api.js';

interface QuizViewProps {
  documents: DocumentItem[];
  prefilledTopic?: string;
  prefilledDocId?: string;
  onRefreshQuizzes: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  documents,
  prefilledTopic = '',
  prefilledDocId = '',
  onRefreshQuizzes,
  onNavigateToTab,
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'take' | 'history'>('create');

  // Generation form
  const [topic, setTopic] = useState(prefilledTopic);
  const [selectedDocId, setSelectedDocId] = useState(prefilledDocId);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionType, setQuestionType] = useState<'mcq' | 'true-false' | 'short-answer' | 'mixed'>('mixed');
  const [count, setCount] = useState(4);
  const [timeLimit, setTimeLimit] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ attempt: QuizAttempt; questions: QuizQuestion[] } | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);

  useEffect(() => {
    loadQuizzesAndHistory();
  }, []);

  useEffect(() => {
    if (prefilledTopic) setTopic(prefilledTopic);
    if (prefilledDocId) setSelectedDocId(prefilledDocId);
  }, [prefilledTopic, prefilledDocId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeftSeconds === null || timeLeftSeconds <= 0 || submissionResult) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(interval);
          handleSubmitQuiz();
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeftSeconds, submissionResult]);

  const loadQuizzesAndHistory = async () => {
    try {
      const [qList, aList] = await Promise.all([
        api.getQuizzes(),
        api.getQuizAttempts(),
      ]);
      setQuizzes(qList);
      setAttempts(aList);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !selectedDocId) {
      alert('Please specify a topic or select an uploaded document.');
      return;
    }

    setIsGenerating(true);
    try {
      const quiz = await api.generateQuiz({
        topic: topic.trim() || undefined,
        documentId: selectedDocId || undefined,
        difficulty,
        questionType,
        count: Number(count),
        timeLimitMinutes: Number(timeLimit),
      });

      setQuizzes(prev => [quiz, ...prev]);
      onRefreshQuizzes();
      startTakingQuiz(quiz);
    } catch (err: any) {
      alert(`Quiz generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const startTakingQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSubmissionResult(null);
    setTimeLeftSeconds(quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null);
    setActiveTab('take');
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    try {
      const res = await api.submitQuiz(activeQuiz.id, userAnswers);
      setSubmissionResult(res);
      loadQuizzesAndHistory();
      onRefreshQuizzes();
    } catch (err: any) {
      alert(`Failed to submit quiz: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Tabs between Create, Active Test, History */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Generate New Quiz
            </button>

            {activeQuiz && (
              <button
                onClick={() => setActiveTab('take')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'take'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>Active Quiz</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            )}

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Past Attempts ({attempts.length})</span>
            </button>
          </div>

          {activeTab === 'take' && timeLeftSeconds !== null && !submissionResult && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-mono font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Time Left: {formatTimer(timeLeftSeconds)}</span>
            </div>
          )}
        </div>

        {/* TAB 1: CREATE QUIZ FORM */}
        {activeTab === 'create' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60 mb-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>AI Automated Assessment Engine</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                AI Quiz Generator
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Generate dynamic, calibrated practice tests from any topic or uploaded study material. Features instant scoring and LLM evaluation for short-answer questions.
              </p>
            </div>

            <form
              onSubmit={handleGenerate}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Topic to Test
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Distributed Systems, Calculus, Microeconomics..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Or Ground in Uploaded Document
                  </label>
                  <select
                    value={selectedDocId}
                    onChange={e => setSelectedDocId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">None (Use topic only)</option>
                    {documents.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.chunkCount} chunks)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Settings row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="easy">Easy (Fundamentals)</option>
                    <option value="medium">Medium (Standard Exam)</option>
                    <option value="hard">Hard (Advanced / Tricky)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Question Type
                  </label>
                  <select
                    value={questionType}
                    onChange={e => setQuestionType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="mixed">Mixed (MCQ + Short Answer)</option>
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="true-false">True / False</option>
                    <option value="short-answer">Short Answer (Open-Ended)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Questions Count
                  </label>
                  <select
                    value={count}
                    onChange={e => setCount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value={3}>3 Questions (Quick check)</option>
                    <option value={5}>5 Questions (Standard)</option>
                    <option value={8}>8 Questions (In-depth)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Time Limit
                  </label>
                  <select
                    value={timeLimit}
                    onChange={e => setTimeLimit(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value={5}>5 Minutes</option>
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={0}>Untimed (No limit)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isGenerating || (!topic.trim() && !selectedDocId)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm transition shadow-sm ${
                    isGenerating || (!topic.trim() && !selectedDocId)
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGenerating ? 'Generating Diagnostic Questions...' : 'Generate and Start Quiz'}</span>
                </button>
              </div>
            </form>

            {/* List of previously generated quizzes */}
            {quizzes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Available Quizzes ({quizzes.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {quizzes.map(q => (
                    <div
                      key={q.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 transition flex flex-col justify-between shadow-2xs"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {q.title}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded capitalize bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">
                          {q.questions.length} Questions • {q.timeLimitMinutes ? `${q.timeLimitMinutes} min limit` : 'Untimed'}
                        </p>
                      </div>

                      <button
                        onClick={() => startTakingQuiz(q)}
                        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Take This Quiz</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE QUIZ TAKER & SUBMISSION REVIEW */}
        {activeTab === 'take' && activeQuiz && (
          <div className="space-y-6">
            {!submissionResult ? (
              // Quiz in progress
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-6">
                {/* Header info */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {activeQuiz.title}
                    </h3>
                    <span className="text-xs text-slate-500">
                      Question {currentQuestionIndex + 1} of {activeQuiz.questions.length} • Difficulty: {activeQuiz.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {activeQuiz.questions.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-3 h-3 rounded-full transition ${
                          idx === currentQuestionIndex
                            ? 'bg-indigo-600 scale-125 ring-2 ring-indigo-400'
                            : userAnswers[activeQuiz.questions[idx].id]
                            ? 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Question Card */}
                {(() => {
                  const q = activeQuiz.questions[currentQuestionIndex];
                  if (!q) return null;

                  return (
                    <div className="space-y-5">
                      <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                        {q.question}
                      </div>

                      {/* Options for MCQ / True-False */}
                      {q.options && q.options.length > 0 ? (
                        <div className="space-y-2.5">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = userAnswers[q.id] === opt;
                            return (
                              <label
                                key={oIdx}
                                className={`flex items-start gap-3 p-3.5 rounded-2xl border text-xs sm:text-sm cursor-pointer transition ${
                                  isSelected
                                    ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-600 text-indigo-950 dark:text-indigo-100 font-medium'
                                    : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`q-${q.id}`}
                                  checked={isSelected}
                                  onChange={() => handleAnswerChange(q.id, opt)}
                                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        // Short answer textarea
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            Your Explanation / Answer (evaluated by AI):
                          </label>
                          <textarea
                            value={userAnswers[q.id] || ''}
                            onChange={e => handleAnswerChange(q.id, e.target.value)}
                            placeholder="Write your explanation here..."
                            rows={4}
                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      )}

                      {/* Navigation buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          disabled={currentQuestionIndex === 0}
                          onClick={() => setCurrentQuestionIndex(prev => Math.max(prev - 1, 0))}
                          className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Previous</span>
                        </button>

                        {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            className="flex items-center gap-1 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                          >
                            <span>Next Question</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleSubmitQuiz}
                            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isSubmitting ? 'Evaluating with AI...' : 'Submit Answers & Grade'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              // Quiz Results View
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-8">
                {/* Score banner */}
                <div className="text-center space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="inline-flex p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <Award className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    Score: {submissionResult.attempt.score} / {submissionResult.attempt.maxScore} ({submissionResult.attempt.percentage}%)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    {submissionResult.attempt.percentage >= 80
                      ? 'Outstanding mastery of the material! You demonstrate strong academic understanding.'
                      : submissionResult.attempt.percentage >= 60
                      ? 'Good effort! Review the detailed model explanations below to solidify weak areas.'
                      : 'Needs revision. Review the recommended concepts below before retaking this test.'}
                  </p>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => startTakingQuiz(activeQuiz)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Quiz</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      New Topic
                    </button>
                  </div>
                </div>

                {/* Recommendations */}
                {submissionResult.attempt.recommendedTopics && submissionResult.attempt.recommendedTopics.length > 0 && (
                  <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/80">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 mb-1.5">
                      Recommended Focus & Revision Topics:
                    </h4>
                    <ul className="list-disc ml-5 space-y-0.5 text-xs text-amber-800 dark:text-amber-300">
                      {submissionResult.attempt.recommendedTopics.map((rec, rIdx) => (
                        <li key={rIdx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Question by Question Detailed Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Detailed Review & Explanations
                  </h4>

                  {submissionResult.questions.map((q, idx) => {
                    const ansResult = submissionResult.attempt.answers.find(a => a.questionId === q.id);
                    const isCorrect = ansResult?.isCorrect;

                    return (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border ${
                          isCorrect
                            ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                        } space-y-3`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            {isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                              {idx + 1}. {q.question}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isCorrect ? 'Correct' : 'Needs Review'}
                          </span>
                        </div>

                        <div className="text-xs space-y-1.5 pl-6">
                          <div>
                            <span className="text-slate-400">Your Answer: </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {ansResult?.userAnswer || '(No answer provided)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Model Correct Answer: </span>
                            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                              {q.correctAnswer}
                            </span>
                          </div>
                          {ansResult?.aiFeedback && (
                            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                                AI Evaluation & Insight:
                              </span>
                              {ansResult.aiFeedback}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QUIZ ATTEMPTS HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Your Recorded Quiz Attempts ({attempts.length})
            </h3>

            {attempts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No past attempts recorded yet
                </h4>
                <p className="text-xs text-slate-500">
                  Take a quiz to see your performance metrics and learning diagnostics.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map(att => (
                  <div
                    key={att.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {att.quizTitle}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Completed {new Date(att.completedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                          {att.percentage}%
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {att.score} / {att.maxScore} pts
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
