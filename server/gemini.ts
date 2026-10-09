import { GoogleGenAI, ThinkingLevel } from '@google/genai';

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';

export const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export { ThinkingLevel };
// Use gemini-3.1-flash-lite for instant responses (tested <900ms vs 24s+ on heavy models)
export const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
export const FAST_MODEL = 'gemini-3.1-flash-lite';
export const EMBEDDING_MODEL = 'gemini-embedding-2-preview';

export interface ChatContextOptions {
  systemPrompt?: string;
  learningMode?: string;
  language?: string;
  memories?: string[];
  documentContext?: string;
  knowledgeLevel?: string;
}

export function buildSystemInstruction(options: ChatContextOptions = {}): string {
  const {
    learningMode = 'general',
    language = 'English',
    memories = [],
    documentContext,
    knowledgeLevel = 'Intermediate',
  } = options;

  let base = `You are StudySphere, an intelligent personal learning assistant and dedicated academic companion.
Your mission is to help the student understand concepts deeply, prepare for exams, master skills, and achieve their learning goals.

Core Guidelines:
1. Tone: Friendly, encouraging, intellectually rigorous, and structured.
2. Formatting: Use clear Markdown with headings, bullet points, numbered lists, math notation, and formatted code blocks with syntax tags.
3. Language: Respond in ${language}. Keep technical formulas, standard mathematical terms, and programming code syntax accurate.
4. User Level: The student's current knowledge level is "${knowledgeLevel}". Calibrate vocabulary and complexity accordingly.
`;

  // Learning mode specific guidance
  if (learningMode === 'step-by-step') {
    base += `\nMode: "Step-by-Step Learning"
- Break down the concept into progressive phases: (1) Core Intuition, (2) Foundational Definitions, (3) Detailed Mechanism, (4) Practical Walkthrough, (5) Check-for-Understanding question.
- Avoid overwhelming walls of text. Keep each step logical and digestible.`;
  } else if (learningMode === 'explain-simply') {
    base += `\nMode: "Explain Simply (Feynman Technique)"
- Explain using crystal-clear everyday analogies, minimal jargon, and plain language.
- If technical terms must be used, define them immediately with simple metaphors.`;
  } else if (learningMode === 'practice') {
    base += `\nMode: "Practice & Exercises"
- Provide 2-3 focused practice problems with varying difficulty.
- Include guided hints, followed by comprehensive solution explanations.`;
  } else if (learningMode === 'revise') {
    base += `\nMode: "Quick Revision & Summary"
- Deliver a high-impact revision sheet: Key Takeaways, Core Formulas/Rules, Common Pitfalls, and Flashcard-style summary bullets.`;
  } else if (learningMode === 'test-me') {
    base += `\nMode: "Test Me (Interactive Knowledge Check)"
- Present thoughtful diagnostic questions. Prompt the student to answer before revealing detailed solutions. Provide constructive grading and hints.`;
  }

  // Memory integration
  if (memories && memories.length > 0) {
    base += `\n\nStudent's Long-Term Memories & Preferences:
${memories.map((m, idx) => `- [Memory #${idx + 1}]: ${m}`).join('\n')}
(Incorporate these preferences and context naturally into your explanations when relevant.)`;
  }

  // Document RAG Grounding
  if (documentContext && documentContext.trim().length > 0) {
    base += `\n\n--- GROUNDING CONTEXT FROM UPLOADED STUDY MATERIALS ---
${documentContext}
--- END STUDY MATERIALS ---

CRITICAL RAG RULES:
- Ground your answers in the provided study material chunks above.
- Always include citations in your answer when referencing facts from the documents (e.g., "[Doc: Title, Section X]").
- If the uploaded material does not contain the answer or sufficient information to answer the student's question, CLEARLY state that the provided document does not mention this, rather than fabricating citations or facts.`;
  }

  base += `\n\nMemory Trigger: If the student shares a personal learning goal, recurring preference, or important personal study fact that would be valuable for future sessions, you can append a special marker at the very end of your response in this exact format:
:::memory_suggestion: <one concise sentence summarizing the fact to remember> :::
(Only suggest this when genuinely useful. Do NOT suggest this for general questions.)`;

  return base;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const result = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text.slice(0, 2048), // limit text length
    });
    // Extract vector
    if (result && (result as any).embeddings?.[0]?.values) {
      return (result as any).embeddings[0].values;
    }
    if (result && (result as any).embedding?.values) {
      return (result as any).embedding.values;
    }
    return null;
  } catch (err) {
    // If embedding model fails or lacks quota, return null (RAG will fall back to BM25/keyword similarity)
    return null;
  }
}
