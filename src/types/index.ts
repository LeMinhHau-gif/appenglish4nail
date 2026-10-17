export type TopicCategory =
  | 'complaints'      // Xử lý phàn nàn & Tình huống khó
  | 'upselling'       // Upsell & Tăng thu nhập
  | 'safety_health'   // An toàn, Vệ sinh & Sức khỏe
  | 'consultation'    // Tư vấn dáng móng, Nghề nghiệp, Xu hướng
  | 'customer_care'   // Chăm sóc khách & Dịch vụ khách hàng
  | 'payment_tips'    // Thanh toán, Tip & Hóa đơn
  | 'salon_skills'    // Dụng cụ, Quy trình & Thuật ngữ tiệm
  | 'small_talk';     // Small talk, Giao tiếp vòng vo & Văn hóa Mỹ

export interface DialogueLine {
  id: string;
  speaker: 'tech' | 'client';
  english: string;
  vietnamese: string;
  ipa?: string;
  tip?: string;
}

export interface KeyPhrase {
  id: string;
  english: string;
  vietnamese: string;
  context: string;
  accentTip?: string;
}

export interface VocabItem {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  exampleEn: string;
  exampleVi: string;
  audioKeyword?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  situation: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  tagline: string;
  category: TopicCategory;
  categoryNameVi: string;
  iconName: string;
  badge: string;
  difficulty: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
  estimatedMinutes: number;
  summary: string;
  culturalNote: string;
  dialogue: DialogueLine[];
  keyPhrases: KeyPhrase[];
  vocabulary: VocabItem[];
  practicalTips: string[];
  quiz: QuizQuestion[];
}

export type SpeechSpeed = 0.5 | 0.65 | 0.75 | 0.85 | 1.0;

export interface WordScore {
  word: string;
  status: 'correct' | 'needs_work' | 'missing';
  tip?: string;
}

export interface PronunciationScoreResult {
  overallScore: number;
  accuracyRating: string;
  wordAnalysis: WordScore[];
  intonationFeedback: string;
  vietnameseSpeakerTips: string[];
  encouragement: string;
  isAiAssessed?: boolean;
  assessmentSource?: string;
}

export interface RecordingHistoryItem {
  id: string;
  lessonId: string;
  targetSentence: string;
  spokenSentence: string;
  audioBlobUrl?: string;
  score: number;
  rating: string;
  timestamp: string;
}

export interface UserStats {
  totalXp: number;
  streakDays: number;
  lastStudiedDate: string;
  completedLessonIds: string[];
  savedVocabIds: string[];
  totalPracticeTimeMinutes: number;
  recordingsCount: number;
  averagePronunciationScore: number;
  remindersEnabled: boolean;
  reminderTime: string;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  salonLocation: string; // e.g. "Houston, TX", "Orange County, CA"
  avatarUrl: string;
  xp: number;
  streak: number;
  badge: string;
  isCurrentUser?: boolean;
}
