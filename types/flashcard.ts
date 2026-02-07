// Flash Card Types

export type CardDifficulty = "easy" | "medium" | "hard";
export type SM2Rating = 0 | 1 | 2 | 3 | 4 | 5;

export interface FlashCard {
  id: string;
  front: string;
  back: string;
  difficulty: CardDifficulty;
  tags: string[];
  hint?: string;
  codeSnippet?: string;
}

export interface GenerateFlashCardsRequest {
  technology: string;
  topic: string;
  count?: number;
  difficulty?: CardDifficulty;
}

export interface GenerateFlashCardsResponse {
  success: boolean;
  cards: FlashCard[];
  error?: string;
}

// Local storage progress tracking
export interface CardProgress {
  cardId: string;
  status: "new" | "learning" | "mastered";
  correctCount: number;
  incorrectCount: number;
  lastReviewedAt?: string;
}

export interface StudySession {
  technology: string;
  topic: string;
  cards: FlashCard[];
  currentIndex: number;
  stats: {
    total: number;
    reviewed: number;
    correct: number;
    incorrect: number;
  };
}
