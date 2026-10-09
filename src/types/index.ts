export interface User {
  id: string;
  email: string;
  name: string;
  preferredLanguage: string;
  theme: 'light' | 'dark';
  enableMemory: boolean;
}

export interface Memory {
  id: string;
  userId: string;
  fact: string;
  category: 'preference' | 'academic' | 'goal' | 'general';
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  chunkIndex: number;
  page?: number;
  snippet: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  filename: string;
  fileType: string;
  fileSize: number;
  chunkCount: number;
  summary?: string;
  createdAt: string;
  chunks?: DocumentChunk[];
}

export interface DocumentCitation {
  documentTitle: string;
  chunkIndex: number;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  documentCitations?: DocumentCitation[];
  memorySuggestion?: string;
  learningMode?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  subject?: string;
  learningMode?: 'general' | 'step-by-step' | 'explain-simply' | 'practice' | 'revise' | 'test-me';
  documentId?: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  documentId?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  timeLimitMinutes?: number;
  createdAt: string;
}

export interface QuizSubmissionAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect?: boolean;
  score?: number;
  aiFeedback?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
  answers: QuizSubmissionAnswer[];
  recommendedTopics?: string[];
}

export interface StudyTask {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  completed: boolean;
  dueDate?: string;
  type: 'concept' | 'reading' | 'practice' | 'quiz' | 'revision';
}

export interface StudyStage {
  id: string;
  title: string;
  order: number;
  tasks: StudyTask[];
}

export interface StudyPlan {
  id: string;
  title: string;
  goal: string;
  targetLevel: 'beginner' | 'intermediate' | 'advanced';
  timeframeWeeks: number;
  availableHoursPerWeek: number;
  status: 'active' | 'paused' | 'completed';
  stages: StudyStage[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  action: 'chat' | 'quiz_taken' | 'document_uploaded' | 'task_completed' | 'lesson_learned';
  details: string;
  timestamp: string;
}

export interface AnalyticsData {
  metrics: {
    topicsStudiedCount: number;
    conversationsCount: number;
    documentsCount: number;
    memoriesCount: number;
    totalQuizAttempts: number;
    avgQuizScore: number;
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
    streakDays: number;
    totalStudyHours: number;
  };
  distinctTopics: string[];
  revisionAreas: string[];
  recentActivities: ActivityLog[];
  aiRecommendation: string;
  recentQuizScores: { title: string; percentage: number; date: string }[];
}

export type ActiveTab =
  | 'chat'
  | 'learning-mode'
  | 'documents'
  | 'memories'
  | 'quizzes'
  | 'planner'
  | 'analytics'
  | 'settings';
