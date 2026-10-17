import React, { useState } from 'react';
import {
  BarChart3,
  Flame,
  Award,
  Clock,
  Mic,
  Play,
  Square,
  Volume2,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { UserStats, RecordingHistoryItem } from '../types';
import { NAIL_LESSONS } from '../data/nailCurriculum';
import { SpeechService } from '../services/speechService';
import { SpeechSpeedControl, useSpeechSpeed } from './SpeechSpeedControl';
import { AdminService } from '../services/adminService';
import { LearnerHistoryRecord } from '../types/rbac';
import { Database, CheckCircle, CloudCheck } from 'lucide-react';

interface ProgressViewProps {
  stats: UserStats;
  recordingHistory: RecordingHistoryItem[];
}

export const ProgressView: React.FC<ProgressViewProps> = ({ stats, recordingHistory }) => {
  const { speed } = useSpeechSpeed();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [dbHistory, setDbHistory] = useState<LearnerHistoryRecord[]>([]);

  const totalLessons = NAIL_LESSONS.length;
  const completedCount = stats.completedLessonIds.length;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  React.useEffect(() => {
    // Load persisted learner history from database
    AdminService.getLearnerHistory().then((data) => {
      if (data && data.length > 0) {
        setDbHistory(data);
      }
    });

    return () => {
      SpeechService.stopSpeaking();
    };
  }, []);

  const handlePlayRecording = (item: RecordingHistoryItem) => {
    if (!item.audioBlobUrl) {
      SpeechService.speak(item.spokenSentence || item.targetSentence, speed);
      return;
    }

    if (playingId === item.id) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(item.audioBlobUrl);
    setPlayingId(item.id);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audio.play();
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
      {/* Cloud Database Connected Banner */}
      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-bold text-emerald-300">Cơ Sở Dữ Liệu Đám Mây:</span>
          <span className="nail-text-secondary hidden sm:inline">Lịch sử học tập & điểm phát âm đã kết nối và lưu trữ an toàn</span>
        </div>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          Đồng bộ DB
        </span>
      </div>

      {/* Top Hero Stats Card */}
      <div className="p-5 rounded-3xl nail-card border nail-border shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider nail-text-primary flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Báo Cáo Tiến Độ Học Tập
            </span>
            <h2 className="text-xl font-black nail-text-main">Thợ Nail Tự Tin Giao Tiếp</h2>
          </div>
          <div className="w-12 h-12 rounded-2xl nail-gradient-accent flex items-center justify-center text-white font-black text-base shadow-md nail-shadow-glow">
            {stats.averagePronunciationScore}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="nail-text-muted">Hoàn thành chương trình</span>
            <span className="nail-text-primary font-bold">{completedCount} / {totalLessons} bài ({progressPercent}%)</span>
          </div>
          <div className="w-full h-2.5 nail-bg-subtle rounded-full overflow-hidden border nail-border-subtle">
            <div
              className="h-full nail-gradient-accent transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* 4 Mini Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl nail-bg-subtle border nail-border text-center space-y-0.5">
            <span className="nail-text-secondary text-xs font-bold flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current" /> Streak
            </span>
            <p className="text-lg font-black nail-text-main">{stats.streakDays} ngày</p>
          </div>

          <div className="p-3 rounded-2xl nail-bg-subtle border nail-border text-center space-y-0.5">
            <span className="nail-text-primary text-xs font-bold flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5" /> Tổng XP
            </span>
            <p className="text-lg font-black nail-text-main">{stats.totalXp}</p>
          </div>

          <div className="p-3 rounded-2xl nail-bg-subtle border nail-border text-center space-y-0.5">
            <span className="text-emerald-400 text-xs font-bold flex items-center justify-center gap-1">
              <Mic className="w-3.5 h-3.5" /> Lần thu âm
            </span>
            <p className="text-lg font-black nail-text-main">{stats.recordingsCount}</p>
          </div>

          <div className="p-3 rounded-2xl nail-bg-subtle border nail-border text-center space-y-0.5">
            <span className="nail-text-secondary text-xs font-bold flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Thời gian học
            </span>
            <p className="text-lg font-black nail-text-main">{stats.totalPracticeTimeMinutes} phút</p>
          </div>
        </div>
      </div>

      {/* Recording History Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold nail-text-main flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-emerald-400" /> Lịch Sử Luyện Phát Âm
          </h3>
          <div className="flex items-center space-x-2">
            <SpeechSpeedControl variant="compact" />
            <span className="text-xs nail-text-muted">
              {recordingHistory.length} câu đã luyện
            </span>
          </div>
        </div>

        {recordingHistory.length === 0 ? (
          <div className="p-8 text-center nail-text-muted text-xs nail-card rounded-2xl">
            Bạn chưa có lần thu âm nào. Hãy vào các bài học hoặc phòng Luyện Nói AI để bắt đầu nhé!
          </div>
        ) : (
          <div className="space-y-2.5">
            {recordingHistory.map((item) => {
              const isPlaying = playingId === item.id;
              const isHigh = item.score >= 80;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl nail-card border nail-border transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                          isHigh
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'nail-badge-gold'
                        }`}
                      >
                        {item.score} điểm • {item.rating}
                      </span>
                      <span className="text-[11px] nail-text-subtle flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.timestamp}
                      </span>
                    </div>

                    <button
                      onClick={() => handlePlayRecording(item)}
                      title="Nghe lại bản thu"
                      className="p-1.5 rounded-xl nail-bg-subtle hover:nail-bg-card-hover text-emerald-400 border nail-border cursor-pointer transition-all active:scale-95"
                    >
                      {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Target Sentence */}
                  <div>
                    <span className="text-[10px] font-bold nail-text-subtle uppercase tracking-wide">
                      Mục tiêu:
                    </span>
                    <p className="text-xs font-bold nail-text-main">
                      "{item.targetSentence}"
                    </p>
                  </div>

                  {/* Spoken transcription */}
                  <div className="nail-bg-subtle p-2 rounded-xl border nail-border-subtle text-xs flex items-start space-x-1.5">
                    <span className="nail-text-subtle shrink-0">Đã nói:</span>
                    <span className="italic font-medium nail-text-muted">
                      "{item.spokenSentence}"
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
