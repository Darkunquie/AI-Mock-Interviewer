import { FLASHCARD_CONFIG } from "./constants";

/**
 * Build the system prompt for flash card generation
 */
export function buildSystemPrompt(): string {
  return `You are an expert technical interviewer creating flash cards for interview preparation.
Generate clear, concise flash cards that test understanding of key concepts.
Return ONLY valid JSON with no markdown formatting or code blocks.`;
}

/**
 * Build the user prompt for flash card generation
 */
export function buildUserPrompt(
  technology: string,
  topic: string,
  count: number = FLASHCARD_CONFIG.defaultCount
): string {
  return `Generate ${count} interview-focused flash cards for ${technology} - ${topic}.

GUIDELINES:
1. Front: Clear, specific technical question (1-2 sentences)
2. Back: Concise but complete answer (2-4 sentences)
3. Include code snippets where helpful
4. Mix of conceptual and practical questions
5. Cover common interview questions for this topic

Return ONLY valid JSON:
{
  "cards": [
    {
      "id": "1",
      "front": "What is the difference between == and === in JavaScript?",
      "back": "== performs type coercion before comparison (loose equality), while === compares both value and type without coercion (strict equality). Always prefer === to avoid unexpected type conversions.",
      "difficulty": "easy",
      "tags": ["${technology}", "${topic}"],
      "hint": "Think about type coercion",
      "codeSnippet": "1 == '1'  // true\\n1 === '1' // false"
    }
  ]
}

Generate exactly ${count} cards with varied difficulty (easy, medium, hard).
Make questions specific to ${technology} ${topic} and relevant for technical interviews.`;
}
