import { UserStats, RecordingHistoryItem } from '../types';
import { AdminService } from './adminService';
import { FirestoreSyncService } from './firestoreSync';

const STORAGE_KEYS = {
  USER_STATS: 'nailspeak_user_stats',
  RECORDING_HISTORY: 'nailspeak_recording_history',
  SAVED_VOCAB: 'nailspeak_saved_vocab',
  REMINDER_SETTINGS: 'nailspeak_reminders',
};

const DEFAULT_STATS: UserStats = {
  totalXp: 1420,
  streakDays: 5,
  lastStudiedDate: new Date().toISOString().split('T')[0],
  completedLessonIds: ['lesson-1'],
  savedVocabIds: ['v1-1', 'v1-4', 'v5-1'],
  totalPracticeTimeMinutes: 45,
  recordingsCount: 12,
  averagePronunciationScore: 82,
  remindersEnabled: true,
  reminderTime: '08:30',
};

export class StorageService {
  public static getUserStats(): UserStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_STATS);
      if (!data) return DEFAULT_STATS;
      return { ...DEFAULT_STATS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_STATS;
    }
  }

  public static saveUserStats(stats: UserStats): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
      // Background sync to database
      AdminService.syncLearnerStats(stats).catch(() => {});
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  public static addXp(points: number): UserStats {
    const stats = this.getUserStats();
    stats.totalXp += points;
    this.updateDailyStreak(stats);
    this.saveUserStats(stats);
    return stats;
  }

  public static markLessonComplete(lessonId: string, lessonTitle?: string): UserStats {
    const stats = this.getUserStats();
    if (!stats.completedLessonIds.includes(lessonId)) {
      stats.completedLessonIds.push(lessonId);
      stats.totalXp += 150; // XP reward for completing a lesson
    }
    this.updateDailyStreak(stats);
    this.saveUserStats(stats);

    // Persist learning action into database
    AdminService.recordLearnerHistory({
      lessonId,
      lessonTitle: lessonTitle || `Bài học ${lessonId}`,
      action: 'lesson_complete',
      score: 100,
      details: 'Hoàn thành trọn vẹn bài học giao tiếp nail',
    }).catch(() => {});

    const currentUser = AdminService.getSavedUser();
    if (currentUser) {
      FirestoreSyncService.recordLearnerHistory({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        lessonId,
        lessonTitle: lessonTitle || `Bài học ${lessonId}`,
        action: 'lesson_complete',
        score: 100,
        details: 'Hoàn thành trọn vẹn bài học giao tiếp nail',
      }).catch(() => {});
    }

    return stats;
  }

  public static toggleSavedVocab(vocabId: string): string[] {
    const stats = this.getUserStats();
    const index = stats.savedVocabIds.indexOf(vocabId);
    if (index >= 0) {
      stats.savedVocabIds.splice(index, 1);
    } else {
      stats.savedVocabIds.push(vocabId);
    }
    this.saveUserStats(stats);
    return stats.savedVocabIds;
  }

  public static addRecordingHistory(item: Omit<RecordingHistoryItem, 'id' | 'timestamp'>): RecordingHistoryItem {
    const stats = this.getUserStats();
    stats.recordingsCount += 1;
    stats.totalPracticeTimeMinutes += 2;
    stats.totalXp += Math.round(item.score * 0.5);

    // Update rolling average score
    const currentTotal = stats.averagePronunciationScore * (stats.recordingsCount - 1);
    stats.averagePronunciationScore = Math.round((currentTotal + item.score) / stats.recordingsCount);

    this.saveUserStats(stats);

    const newItem: RecordingHistoryItem = {
      ...item,
      id: 'rec_' + Date.now(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      const existing = this.getRecordingHistory();
      const updated = [newItem, ...existing].slice(0, 30); // keep last 30 recordings
      localStorage.setItem(STORAGE_KEYS.RECORDING_HISTORY, JSON.stringify(updated));

      // Persist to server database
      AdminService.recordLearnerHistory({
        lessonId: item.lessonId,
        action: 'recording_practice',
        score: item.score,
        targetSentence: item.targetSentence,
        spokenSentence: item.spokenSentence,
        details: `Luyện phát âm AI (${item.score}đ - ${item.rating})`,
      }).catch(() => {});

      const currentUser = AdminService.getSavedUser();
      if (currentUser) {
        FirestoreSyncService.recordLearnerHistory({
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          lessonId: item.lessonId,
          action: 'recording_practice',
          score: item.score,
          targetSentence: item.targetSentence,
          spokenSentence: item.spokenSentence,
          details: `Luyện phát âm AI (${item.score}đ - ${item.rating})`,
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed saving recording item:', e);
    }

    return newItem;
  }

  public static getRecordingHistory(): RecordingHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECORDING_HISTORY);
      if (!data) {
        return [
          {
            id: 'init-1',
            lessonId: 'lesson-1',
            targetSentence: "I'm going to slow down and take my time on this.",
            spokenSentence: "I am going to slow down and take my time on this.",
            score: 92,
            rating: 'Xuất sắc',
            timestamp: 'Hôm qua'
          },
          {
            id: 'init-2',
            lessonId: 'lesson-3',
            targetSentence: "We have UV-protective gloves with the fingertips cut off.",
            spokenSentence: "We have UV protective gloves with fingertips cut off.",
            score: 84,
            rating: 'Tốt',
            timestamp: '2 ngày trước'
          }
        ];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private static updateDailyStreak(stats: UserStats) {
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastStudiedDate !== today) {
      const lastDate = new Date(stats.lastStudiedDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        stats.streakDays += 1;
      } else if (diffDays > 1) {
        stats.streakDays = 1;
      }
      stats.lastStudiedDate = today;
    }
  }
}
