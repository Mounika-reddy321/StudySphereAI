import {
  User,
  Conversation,
  ChatMessage,
  Memory,
  DocumentItem,
  Quiz,
  QuizAttempt,
  StudyPlan,
  AnalyticsData,
} from '../types/index.js';

const TOKEN_KEY = 'studysphere_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set Content-Type only if not sending FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Status
  async getStatus(): Promise<{ status: string; hasGeminiKey: boolean }> {
    return request('/api/status');
  },

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(data: { email: string; password: string; name: string; preferredLanguage?: string }): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<User> {
    return request<User>('/api/auth/me');
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    return request<User>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteAccount(): Promise<{ message: string }> {
    const res = await request<{ message: string }>('/api/auth/account', {
      method: 'DELETE',
    });
    setStoredToken(null);
    return res;
  },

  logout(): void {
    setStoredToken(null);
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    return request<Conversation[]>('/api/conversations');
  },

  async createConversation(data: { title?: string; learningMode?: string; documentId?: string; language?: string }): Promise<Conversation> {
    return request<Conversation>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: ChatMessage[] }> {
    return request<{ conversation: Conversation; messages: ChatMessage[] }>(`/api/conversations/${id}`);
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    return request<Conversation>(`/api/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteConversation(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/conversations/${id}`, {
      method: 'DELETE',
    });
  },

  // Chat
  async sendChatMessage(payload: {
    conversationId?: string;
    message: string;
    learningMode?: string;
    documentId?: string;
    language?: string;
    knowledgeLevel?: string;
  }): Promise<{
    conversationId: string;
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
  }> {
    return request('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async streamChatMessage(
    payload: {
      conversationId?: string;
      message: string;
      learningMode?: string;
      documentId?: string;
      language?: string;
      knowledgeLevel?: string;
    },
    callbacks: {
      onInit?: (data: { conversationId: string; userMessage: ChatMessage }) => void;
      onChunk?: (text: string) => void;
      onDone?: (data: { assistantMessage: ChatMessage }) => void;
      onError?: (err: Error) => void;
    },
    signal?: AbortSignal
  ): Promise<void> {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      let errText = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        errText = errJson.error || errText;
      } catch {
        // ignore
      }
      throw new Error(errText);
    }

    if (!response.body) {
      throw new Error('Streaming response body is missing');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          if (!block.trim()) continue;
          let eventType = 'message';
          let dataStr = '';

          const lines = block.split('\n');
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6);
            }
          }

          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (eventType === 'init' && callbacks.onInit) {
              callbacks.onInit(parsed);
            } else if (eventType === 'chunk' && callbacks.onChunk) {
              callbacks.onChunk(parsed.text || '');
            } else if (eventType === 'done' && callbacks.onDone) {
              callbacks.onDone(parsed);
            } else if (eventType === 'error') {
              if (callbacks.onError) callbacks.onError(new Error(parsed.error || 'Stream error'));
            }
          } catch (e) {
            console.warn('Failed to parse SSE payload:', e);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      if (callbacks.onError) callbacks.onError(err);
      throw err;
    }
  },

  // Memories
  async getMemories(searchQuery = ''): Promise<{ memories: Memory[]; memoryEnabled: boolean }> {
    const query = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
    return request(`/api/memories${query}`);
  },

  async addMemory(fact: string, category: Memory['category'] = 'general', source?: string): Promise<Memory> {
    return request<Memory>('/api/memories', {
      method: 'POST',
      body: JSON.stringify({ fact, category, source }),
    });
  },

  async updateMemory(id: string, data: { fact?: string; category?: Memory['category'] }): Promise<Memory> {
    return request<Memory>(`/api/memories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteMemory(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/memories/${id}`, {
      method: 'DELETE',
    });
  },

  async clearMemories(): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/memories/clear', {
      method: 'POST',
    });
  },

  // Documents
  async getDocuments(): Promise<DocumentItem[]> {
    return request<DocumentItem[]>('/api/documents');
  },

  async uploadDocument(file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    return request<DocumentItem>('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async getDocument(id: string): Promise<DocumentItem> {
    return request<DocumentItem>(`/api/documents/${id}`);
  },

  async deleteDocument(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/documents/${id}`, {
      method: 'DELETE',
    });
  },

  async runDocumentAction(id: string, action: 'summarize' | 'explain' | 'definitions' | 'exam-questions' | 'revision-notes', passage?: string): Promise<{
    action: string;
    documentTitle: string;
    result: string;
  }> {
    return request(`/api/documents/${id}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action, passage }),
    });
  },

  // Quizzes
  async getQuizzes(): Promise<Quiz[]> {
    return request<Quiz[]>('/api/quizzes');
  },

  async generateQuiz(payload: {
    topic?: string;
    documentId?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    questionType?: 'mcq' | 'true-false' | 'short-answer' | 'mixed';
    count?: number;
    timeLimitMinutes?: number;
  }): Promise<Quiz> {
    return request<Quiz>('/api/quizzes/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getQuiz(id: string): Promise<Quiz> {
    return request<Quiz>(`/api/quizzes/${id}`);
  },

  async submitQuiz(id: string, answers: Record<string, string>): Promise<{ attempt: QuizAttempt; questions: any[] }> {
    return request(`/api/quizzes/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  async getQuizAttempts(): Promise<QuizAttempt[]> {
    return request<QuizAttempt[]>('/api/quizzes/attempts/history');
  },

  async deleteQuiz(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/quizzes/${id}`, {
      method: 'DELETE',
    });
  },

  // Study Planner
  async getStudyPlans(): Promise<StudyPlan[]> {
    return request<StudyPlan[]>('/api/study-plans');
  },

  async generateStudyPlan(payload: {
    goal: string;
    targetLevel?: 'beginner' | 'intermediate' | 'advanced';
    timeframeWeeks?: number;
    availableHoursPerWeek?: number;
  }): Promise<StudyPlan> {
    return request<StudyPlan>('/api/study-plans/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async toggleTask(planId: string, taskId: string, completed?: boolean): Promise<{ task: any; plan: StudyPlan }> {
    return request(`/api/study-plans/${planId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    });
  },

  async updateStudyPlan(planId: string, updates: Partial<StudyPlan>): Promise<StudyPlan> {
    return request<StudyPlan>(`/api/study-plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteStudyPlan(planId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/study-plans/${planId}`, {
      method: 'DELETE',
    });
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsData> {
    return request<AnalyticsData>('/api/analytics');
  },
};
