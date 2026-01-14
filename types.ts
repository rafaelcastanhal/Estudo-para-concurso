export interface SyllabusTopic {
  id: string;
  name: string;
  description: string;
  icon: string; // Added for better UI
}

export type DifficultyLevel = 'Iniciante' | 'Intermediário' | 'Avançado';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  // Structured Explanation Fields
  correctExplanation: string; // Why the correct answer is right
  distractorAnalysis: string[]; // Specific reasons why other options are wrong
  conceptExplanation: string; // Theoretical summary of the topic
  legalBasis: string; // "CF/88 Art. 5...", "Gramática Cegalla..."
  studyTip: string; // "Focus on..."
  
  topicRef: string; 
  difficulty: DifficultyLevel;
}

export enum AppState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  QUIZ = 'QUIZ',
  ERROR = 'ERROR'
}

export interface UserStats {
  totalAnswered: number;
  correct: number;
  streak: number;
  masteryByTopic: Record<string, number>; // 0 to 100
}