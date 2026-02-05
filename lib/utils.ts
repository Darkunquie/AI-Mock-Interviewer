import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Semantic keyword matching with fuzzy logic
 * Checks if a keyword is semantically present in the answer text
 */
export function semanticKeywordMatch(
  keyword: string,
  answerText: string
): boolean {
  const normalizedKeyword = keyword.toLowerCase().trim();
  const normalizedAnswer = answerText.toLowerCase();

  // 1. Exact match
  if (normalizedAnswer.includes(normalizedKeyword)) {
    return true;
  }

  // 2. Plural/singular variations
  const variations = [
    normalizedKeyword,
    normalizedKeyword + 's',
    normalizedKeyword + 'es',
    normalizedKeyword.endsWith('s') ? normalizedKeyword.slice(0, -1) : '',
  ].filter(Boolean);

  for (const variant of variations) {
    if (normalizedAnswer.includes(variant)) {
      return true;
    }
  }

  // 3. Common technical variations
  const technicalVariations: Record<string, string[]> = {
    'function': ['func', 'method', 'procedure'],
    'variable': ['var', 'identifier'],
    'class': ['object', 'instance'],
    'array': ['list', 'collection'],
    'object': ['dict', 'dictionary', 'map'],
    'async': ['asynchronous', 'await'],
    'sync': ['synchronous'],
    'decorator': ['wrapper', 'annotation'],
    'inheritance': ['extends', 'subclass'],
    'polymorphism': ['override', 'overload'],
    'immutable': ['unchangeable', 'constant'],
    'mutable': ['changeable', 'modifiable'],
  };

  // Check if keyword has known variations
  if (technicalVariations[normalizedKeyword]) {
    for (const synonym of technicalVariations[normalizedKeyword]) {
      if (normalizedAnswer.includes(synonym)) {
        return true;
      }
    }
  }

  // Check reverse (if answer contains a keyword that's a synonym)
  for (const [key, synonyms] of Object.entries(technicalVariations)) {
    if (synonyms.includes(normalizedKeyword) && normalizedAnswer.includes(key)) {
      return true;
    }
  }

  // 4. Word boundary matching (avoid partial matches like "test" in "latest")
  const wordBoundaryRegex = new RegExp(`\\b${normalizedKeyword}\\w*\\b`, 'i');
  if (wordBoundaryRegex.test(answerText)) {
    return true;
  }

  return false;
}

/**
 * Validates answer against keywords and calculates coverage
 */
export function validateKeywords(
  keywords: string[],
  answerText: string
): {
  score: number;
  covered: string[];
  missed: string[];
  passed: boolean;
} {
  if (!keywords || keywords.length === 0) {
    return { score: 10, covered: [], missed: [], passed: true };
  }

  const covered: string[] = [];
  const missed: string[] = [];

  for (const keyword of keywords) {
    if (semanticKeywordMatch(keyword, answerText)) {
      covered.push(keyword);
    } else {
      missed.push(keyword);
    }
  }

  const coverageRatio = covered.length / keywords.length;
  const score = Math.round(coverageRatio * 10);

  // Minimum threshold: at least 40% of keywords must be present
  const MINIMUM_THRESHOLD = 0.4;
  const passed = coverageRatio >= MINIMUM_THRESHOLD;

  return { score, covered, missed, passed };
}
