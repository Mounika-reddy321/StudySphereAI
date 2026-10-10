import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  preferredLanguage: string;
  theme: 'light' | 'dark';
  enableMemory: boolean;
  createdAt: string;
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
  content: string;
  page?: number;
  embedding?: number[];
}

export interface DocumentItem {
  id: string;
  userId: string;
  title: string;
  filename: string;
  fileType: string;
  fileSize: number;
  chunkCount: number;
  extractedText: string;
  chunks: DocumentChunk[];
  summary?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  documentCitations?: { documentTitle: string; chunkIndex: number; snippet: string }[];
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
  options?: string[]; // for mcq
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  userId: string;
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
  score?: number; // 0 to 1
  aiFeedback?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
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
  userId: string;
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
  userId: string;
  action: 'chat' | 'quiz_taken' | 'document_uploaded' | 'task_completed' | 'lesson_learned';
  details: string;
  timestamp: string;
}

export interface ResumeExperience {
  role: string;
  organization: string;
  location?: string;
  period: string;
  bullets: string[];
}

export interface ResumeProject {
  title: string;
  technologies: string[];
  link?: string;
  bullets: string[];
}

export interface ResumeEducation {
  institution: string;
  degree: string;
  field: string;
  year: string;
  gpa?: string;
  highlights?: string[];
}

export interface ResumeData {
  id: string;
  userId: string;
  title: string;
  targetRole: string;
  style: 'modern-tech' | 'academic-cv' | 'minimalist' | 'executive';
  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary: string;
  skills: {
    category: string;
    items: string[];
  }[];
  education: ResumeEducation[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  certifications?: string[];
  markdownContent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlideItem {
  slideNumber: number;
  title: string;
  subtitle?: string;
  layout: 'title-slide' | 'bullet-list' | 'two-column' | 'quote-stat' | 'conclusion-qa' | 'process-steps';
  bulletPoints: string[];
  speakerNotes: string;
  keyTakeaway?: string;
  columnLeft?: { heading: string; points: string[] };
  columnRight?: { heading: string; points: string[] };
  statNumber?: string;
  statLabel?: string;
}

export interface PresentationDeck {
  id: string;
  userId: string;
  topic: string;
  title: string;
  subtitle?: string;
  presenter: string;
  themeStyle: 'navy-academic' | 'modern-dark' | 'minimal-light' | 'tech-gradient';
  slides: SlideItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  memories: Memory[];
  documents: DocumentItem[];
  conversations: Conversation[];
  messages: ChatMessage[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  studyPlans: StudyPlan[];
  activities: ActivityLog[];
  resumes: ResumeData[];
  presentations: PresentationDeck[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'studysphere.db.json');

const initialDatabase: DatabaseSchema = {
  users: [],
  memories: [],
  documents: [],
  conversations: [],
  messages: [],
  quizzes: [],
  quizAttempts: [],
  studyPlans: [],
  activities: [],
  resumes: [],
  presentations: [],
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
    this.seedDefaultData();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return { ...initialDatabase, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error('Error loading DB file, initializing fresh:', err);
    }
    return { ...initialDatabase };
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  private seedDefaultData() {
    // If no users, create default student user: student@studysphere.edu / password123
    if (this.data.users.length === 0) {
      const defaultUser: User = {
        id: 'usr-student-01',
        email: 'student@studysphere.edu',
        name: 'Alex Rivera',
        passwordHash: 'c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd472634dfac71e088d94ee54b4dbac830c588b52f20c334e3eaec71286a64c1caa', // sha512 for password123
        salt: 'studysphere_default_salt',
        preferredLanguage: 'English',
        theme: 'light',
        enableMemory: true,
        createdAt: new Date().toISOString(),
      };
      this.data.users.push(defaultUser);

      // Seed initial sample memories
      this.data.memories.push(
        {
          id: 'mem-01',
          userId: defaultUser.id,
          fact: 'Preparing for Machine Learning & Distributed Systems exams in May.',
          category: 'goal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mem-02',
          userId: defaultUser.id,
          fact: 'Prefers explanations with real-world Python code examples and intuitive analogies.',
          category: 'preference',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );

      // Seed initial conversation
      const convId = 'conv-welcome-01';
      this.data.conversations.push({
        id: convId,
        userId: defaultUser.id,
        title: 'Introduction to Transformers & Attention Mechanism',
        subject: 'Computer Science',
        learningMode: 'step-by-step',
        language: 'English',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      this.data.messages.push(
        {
          id: 'msg-01',
          conversationId: convId,
          role: 'user',
          content: 'Can you explain how Self-Attention works in simple terms with an example?',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'msg-02',
          conversationId: convId,
          role: 'assistant',
          content: `### Understanding Self-Attention

Self-attention allows a neural network to weigh the importance of different words in a sentence when processing a specific word.

#### The Intuitive Analogy: The Cocktail Party
Imagine you are at a noisy cocktail party talking to a friend:
- **Query ($Q$):** What you are currently listening for.
- **Key ($K$):** The sound tags from every person speaking in the room.
- **Value ($V$):** The actual spoken content.

When your Query matches a Key (a friend mentioning your name), the attention score shoots up, allowing you to focus on their Value!

#### Mathematical Core
The scaled dot-product attention formula is:
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

#### Quick Python Illustration
\`\`\`python
import numpy as np

def scaled_dot_product_attention(Q, K, V):
    d_k = Q.shape[-1]
    scores = np.matmul(Q, K.T) / np.sqrt(d_k)
    weights = np.exp(scores) / np.sum(np.exp(scores), axis=-1, keepdims=True)
    return np.matmul(weights, V), weights
\`\`\`

Would you like to explore Multi-Head Attention next or test your understanding with a short quiz?`,
          timestamp: new Date().toISOString(),
        }
      );

      // Seed initial sample quiz
      const quizId = 'quiz-sample-01';
      this.data.quizzes.push({
        id: quizId,
        userId: defaultUser.id,
        title: 'Deep Learning & Attention Foundations',
        topic: 'Machine Learning',
        difficulty: 'medium',
        timeLimitMinutes: 10,
        createdAt: new Date().toISOString(),
        questions: [
          {
            id: 'q1',
            type: 'mcq',
            question: 'Why do we scale the dot product of Q and K by $\\sqrt{d_k}$ in scaled dot-product attention?',
            options: [
              'To prevent the dot products from growing excessively large for large dimensions, which would cause small gradients in softmax.',
              'To speed up matrix multiplication.',
              'To ensure matrix dimensions match during backpropagation.',
              'To normalize values between 0 and 1.'
            ],
            correctAnswer: 'To prevent the dot products from growing excessively large for large dimensions, which would cause small gradients in softmax.',
            explanation: 'For large values of d_k, dot products grow large in magnitude, pushing the softmax function into regions with extremely small gradients. Dividing by $\\sqrt{d_k}$ stabilizes training.'
          },
          {
            id: 'q2',
            type: 'true-false',
            question: 'True or False: Transformers process input tokens sequentially like Recurrent Neural Networks (RNNs).',
            options: ['True', 'False'],
            correctAnswer: 'False',
            explanation: 'Transformers process all tokens simultaneously in parallel using positional encodings rather than sequential recurrence.'
          },
          {
            id: 'q3',
            type: 'short-answer',
            question: 'What is the purpose of Positional Encoding in the Transformer architecture?',
            correctAnswer: 'Since transformers process tokens simultaneously without recurrence or convolution, positional encodings inject information about the relative or absolute position of tokens in the sequence.',
            explanation: 'Without positional encodings, the attention mechanism is permutation invariant.'
          }
        ]
      });

      // Sample activity logs
      this.data.activities.push(
        {
          id: 'act-01',
          userId: defaultUser.id,
          action: 'chat',
          details: 'Explored Self-Attention mechanisms in deep learning',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'act-02',
          userId: defaultUser.id,
          action: 'task_completed',
          details: 'Finished lesson on Attention Math & Matrix Dimensions',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        }
      );

      // Sample Study Plan
      this.data.studyPlans.push({
        id: 'plan-01',
        userId: defaultUser.id,
        title: 'Master Transformer Architectures & LLM Engineering',
        goal: 'Understand transformer internals, RAG pipelines, and build production AI systems.',
        targetLevel: 'intermediate',
        timeframeWeeks: 4,
        availableHoursPerWeek: 8,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stages: [
          {
            id: 'stg-1',
            title: 'Week 1: Attention & Architecture Foundations',
            order: 1,
            tasks: [
              {
                id: 'tsk-101',
                title: 'Review Dot-Product & Multi-Head Attention',
                description: 'Study Q, K, V projections and matrix dimension shapes.',
                durationMinutes: 45,
                completed: true,
                type: 'concept'
              },
              {
                id: 'tsk-102',
                title: 'Implement scaled dot-product attention in Python/NumPy',
                description: 'Code the forward pass and verify softmax weight distributions.',
                durationMinutes: 60,
                completed: true,
                type: 'practice'
              },
              {
                id: 'tsk-103',
                title: 'Take Deep Learning Attention Quiz',
                description: 'Test understanding of scaling factor and positional encoding.',
                durationMinutes: 20,
                completed: false,
                type: 'quiz'
              }
            ]
          },
          {
            id: 'stg-2',
            title: 'Week 2: Embeddings, Vector Search & RAG Systems',
            order: 2,
            tasks: [
              {
                id: 'tsk-201',
                title: 'Study Chunking strategies and Vector Embeddings',
                description: 'Explore cosine similarity, token limits, and semantic chunking.',
                durationMinutes: 50,
                completed: false,
                type: 'reading'
              },
              {
                id: 'tsk-202',
                title: 'Upload textbook chapter and test document Q&A in StudySphere',
                description: 'Verify grounded citations and retrieval accuracy.',
                durationMinutes: 40,
                completed: false,
                type: 'practice'
              }
            ]
          }
        ]
      });

      this.save();
    }
  }

  // User methods
  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);
    // Cascade delete user data
    this.data.memories = this.data.memories.filter(m => m.userId !== id);
    this.data.documents = this.data.documents.filter(d => d.userId !== id);
    const convIds = this.data.conversations.filter(c => c.userId === id).map(c => c.id);
    this.data.conversations = this.data.conversations.filter(c => c.userId !== id);
    this.data.messages = this.data.messages.filter(m => !convIds.includes(m.conversationId));
    this.data.quizzes = this.data.quizzes.filter(q => q.userId !== id);
    this.data.quizAttempts = this.data.quizAttempts.filter(q => q.userId !== id);
    this.data.studyPlans = this.data.studyPlans.filter(p => p.userId !== id);
    this.data.activities = this.data.activities.filter(a => a.userId !== id);
    this.save();
    return true;
  }

  // Memory methods
  getMemories(userId: string): Memory[] {
    return this.data.memories.filter(m => m.userId === userId);
  }

  getMemoryById(id: string): Memory | undefined {
    return this.data.memories.find(m => m.id === id);
  }

  createMemory(memory: Memory): Memory {
    this.data.memories.push(memory);
    this.save();
    return memory;
  }

  updateMemory(id: string, updates: Partial<Memory>): Memory | undefined {
    const memory = this.getMemoryById(id);
    if (!memory) return undefined;
    Object.assign(memory, { ...updates, updatedAt: new Date().toISOString() });
    this.save();
    return memory;
  }

  deleteMemory(id: string, userId: string): boolean {
    const idx = this.data.memories.findIndex(m => m.id === id && m.userId === userId);
    if (idx === -1) return false;
    this.data.memories.splice(idx, 1);
    this.save();
    return true;
  }

  clearMemories(userId: string): void {
    this.data.memories = this.data.memories.filter(m => m.userId !== userId);
    this.save();
  }

  // Document methods
  getDocuments(userId: string): DocumentItem[] {
    return this.data.documents.filter(d => d.userId === userId);
  }

  getDocumentById(id: string, userId: string): DocumentItem | undefined {
    return this.data.documents.find(d => d.id === id && d.userId === userId);
  }

  createDocument(doc: DocumentItem): DocumentItem {
    this.data.documents.push(doc);
    this.save();
    return doc;
  }

  deleteDocument(id: string, userId: string): boolean {
    const idx = this.data.documents.findIndex(d => d.id === id && d.userId === userId);
    if (idx === -1) return false;
    this.data.documents.splice(idx, 1);
    this.save();
    return true;
  }

  // Conversation & Message methods
  getConversations(userId: string): Conversation[] {
    return this.data.conversations
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getConversationById(id: string, userId: string): Conversation | undefined {
    return this.data.conversations.find(c => c.id === id && c.userId === userId);
  }

  createConversation(conv: Conversation): Conversation {
    this.data.conversations.push(conv);
    this.save();
    return conv;
  }

  updateConversation(id: string, userId: string, updates: Partial<Conversation>): Conversation | undefined {
    const conv = this.getConversationById(id, userId);
    if (!conv) return undefined;
    Object.assign(conv, { ...updates, updatedAt: new Date().toISOString() });
    this.save();
    return conv;
  }

  deleteConversation(id: string, userId: string): boolean {
    const idx = this.data.conversations.findIndex(c => c.id === id && c.userId === userId);
    if (idx === -1) return false;
    this.data.conversations.splice(idx, 1);
    this.data.messages = this.data.messages.filter(m => m.conversationId !== id);
    this.save();
    return true;
  }

  getMessages(conversationId: string): ChatMessage[] {
    return this.data.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  createMessage(msg: ChatMessage): ChatMessage {
    this.data.messages.push(msg);
    // update parent conversation updatedAt
    const conv = this.data.conversations.find(c => c.id === msg.conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
    }
    this.save();
    return msg;
  }

  deleteMessage(messageId: string): boolean {
    const idx = this.data.messages.findIndex(m => m.id === messageId);
    if (idx === -1) return false;
    this.data.messages.splice(idx, 1);
    this.save();
    return true;
  }

  // Quiz methods
  getQuizzes(userId: string): Quiz[] {
    return this.data.quizzes
      .filter(q => q.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getQuizById(id: string, userId: string): Quiz | undefined {
    return this.data.quizzes.find(q => q.id === id && q.userId === userId);
  }

  createQuiz(quiz: Quiz): Quiz {
    this.data.quizzes.push(quiz);
    this.save();
    return quiz;
  }

  deleteQuiz(id: string, userId: string): boolean {
    const idx = this.data.quizzes.findIndex(q => q.id === id && q.userId === userId);
    if (idx === -1) return false;
    this.data.quizzes.splice(idx, 1);
    this.save();
    return true;
  }

  createQuizAttempt(attempt: QuizAttempt): QuizAttempt {
    this.data.quizAttempts.push(attempt);
    this.save();
    return attempt;
  }

  getQuizAttempts(userId: string): QuizAttempt[] {
    return this.data.quizAttempts
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  // Study Plan methods
  getStudyPlans(userId: string): StudyPlan[] {
    return this.data.studyPlans
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getStudyPlanById(id: string, userId: string): StudyPlan | undefined {
    return this.data.studyPlans.find(p => p.id === id && p.userId === userId);
  }

  createStudyPlan(plan: StudyPlan): StudyPlan {
    this.data.studyPlans.push(plan);
    this.save();
    return plan;
  }

  updateStudyPlan(id: string, userId: string, updates: Partial<StudyPlan>): StudyPlan | undefined {
    const plan = this.getStudyPlanById(id, userId);
    if (!plan) return undefined;
    Object.assign(plan, { ...updates, updatedAt: new Date().toISOString() });
    this.save();
    return plan;
  }

  deleteStudyPlan(id: string, userId: string): boolean {
    const idx = this.data.studyPlans.findIndex(p => p.id === id && p.userId === userId);
    if (idx === -1) return false;
    this.data.studyPlans.splice(idx, 1);
    this.save();
    return true;
  }

  // Activity Log methods
  logActivity(userId: string, action: ActivityLog['action'], details: string): ActivityLog {
    const log: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.activities.push(log);
    this.save();
    return log;
  }

  getActivities(userId: string): ActivityLog[] {
    return this.data.activities
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Resume methods
  getResumes(userId: string): ResumeData[] {
    if (!this.data.resumes) this.data.resumes = [];
    return this.data.resumes
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getResumeById(id: string, userId: string): ResumeData | undefined {
    if (!this.data.resumes) this.data.resumes = [];
    return this.data.resumes.find(r => r.id === id && r.userId === userId);
  }

  createResume(resume: ResumeData): ResumeData {
    if (!this.data.resumes) this.data.resumes = [];
    this.data.resumes.push(resume);
    this.save();
    return resume;
  }

  updateResume(id: string, userId: string, updates: Partial<ResumeData>): ResumeData | undefined {
    const resume = this.getResumeById(id, userId);
    if (!resume) return undefined;
    Object.assign(resume, { ...updates, updatedAt: new Date().toISOString() });
    this.save();
    return resume;
  }

  deleteResume(id: string, userId: string): boolean {
    if (!this.data.resumes) this.data.resumes = [];
    const idx = this.data.resumes.findIndex(r => r.id === id && r.userId === userId);
    if (idx === -1) return false;
    this.data.resumes.splice(idx, 1);
    this.save();
    return true;
  }

  // Presentation methods
  getPresentations(userId: string): PresentationDeck[] {
    if (!this.data.presentations) this.data.presentations = [];
    return this.data.presentations
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getPresentationById(id: string, userId: string): PresentationDeck | undefined {
    if (!this.data.presentations) this.data.presentations = [];
    return this.data.presentations.find(p => p.id === id && p.userId === userId);
  }

  createPresentation(deck: PresentationDeck): PresentationDeck {
    if (!this.data.presentations) this.data.presentations = [];
    this.data.presentations.push(deck);
    this.save();
    return deck;
  }

  deletePresentation(id: string, userId: string): boolean {
    if (!this.data.presentations) this.data.presentations = [];
    const idx = this.data.presentations.findIndex(p => p.id === id && p.userId === userId);
    if (idx === -1) return false;
    this.data.presentations.splice(idx, 1);
    this.save();
    return true;
  }
}

export const db = new Database();
