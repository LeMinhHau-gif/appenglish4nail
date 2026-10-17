import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Volume2, RefreshCw, Sparkles, X, Award, Play, Square, Bot, Zap } from 'lucide-react';
import { PronunciationScoreResult } from '../types';
import { SpeechService } from '../services/speechService';
import { SpeechSpeedControl, useSpeechSpeed } from './SpeechSpeedControl';

interface AIPronunciationModalProps {
  targetSentence: string;
  spokenSentence: string;
  scoreResult: PronunciationScoreResult;
  userAudioBlob?: Blob | null;
  onClose: () => void;
  onRetry: () => void;
}

export const AIPronunciationModal: React.FC<AIPronunciationModalProps> = ({
  targetSentence,
  spokenSentence,
  scoreResult,
  userAudioBlob,
  onClose,
  onRetry,
}) => {
  const { speed } = useSpeechSpeed();
  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);

  useEffect(() => {
    return () => {
      SpeechService.stopSpeaking();
    };
  }, []);

  const handlePlayNative = async () => {
    setIsPlayingNative(true);
    await SpeechService.speak(targetSentence, speed);
    setIsPlayingNative(false);
  };

  const handlePlayUserAudio = () => {
    if (!userAudioBlob) return;
    try {
      const audioUrl = URL.createObjectURL(userAudioBlob);
      const audio = new Audio(audioUrl);
      setIsPlayingUserAudio(true);
      audio.onended = () => setIsPlayingUserAudio(false);
      audio.onerror = () => setIsPlayingUserAudio(false);
      audio.play();
    } catch (e) {
      console.warn('Playback error:', e);
      setIsPlayingUserAudio(false);
    }
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 85) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (score >= 70) return 'nail-badge-gold';
    if (score >= 50) return 'nail-badge-primary';
    return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="nail-card border nail-border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col nail-text-main">
        {/* Header */}
        <div className="p-4 border-b nail-border flex items-center justify-between sticky top-0 nail-bg-card backdrop-blur z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl nail-gradient-accent flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black nail-text-main leading-tight">Chấm Điểm Phát Âm AI</h3>
              <p className="text-xs nail-text-muted">Đánh giá theo chuẩn giao tiếp khách Mỹ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl nail-bg-subtle hover:nail-bg-card-hover nail-text-muted hover:nail-text-main transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Score Badge Hero */}
          <div className="flex items-center justify-between p-4 rounded-2xl nail-bg-subtle border nail-border shadow-xs">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider nail-text-subtle font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5 nail-text-secondary" /> Kết quả chấm điểm
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black nail-text-main">
                  {scoreResult.overallScore}
                </span>
                <span className="text-sm nail-text-muted font-medium">/ 100</span>
              </div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreBadgeClass(scoreResult.overallScore)}`}>
                  {scoreResult.accuracyRating}
                </span>

                {scoreResult.isAiAssessed ? (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full nail-badge-primary text-[10px] font-semibold">
                    <Bot className="w-3 h-3" />
                    <span>AI Gemini chấm điểm</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full nail-bg-card nail-text-muted border nail-border text-[10px] font-semibold" title={scoreResult.assessmentSource || 'Đối chiếu tham khảo khi offline'}>
                    <Zap className="w-3 h-3 nail-text-secondary" />
                    <span>Điểm đối chiếu tham khảo</span>
                  </span>
                )}
              </div>
            </div>

            {/* Circular Graphic Indicator */}
            <div className="relative w-18 h-18 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="opacity-20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={scoreResult.overallScore >= 70 ? 'text-emerald-400' : 'nail-text-primary'}
                  strokeDasharray={`${scoreResult.overallScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-sm font-black nail-text-main">
                {scoreResult.overallScore}%
              </span>
            </div>
          </div>

          {/* Target sentence & Word Breakdown */}
          <div className="nail-card p-3.5 rounded-2xl border nail-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold nail-text-main">Phân tích từng từ phát âm:</span>
              <div className="flex items-center space-x-2">
                <SpeechSpeedControl variant="compact" />
                <button
                  onClick={handlePlayNative}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-xl nail-bg-subtle hover:nail-bg-card-hover text-xs nail-text-primary font-bold border nail-border cursor-pointer transition-all active:scale-95"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isPlayingNative ? 'Đang đọc...' : 'Nghe mẫu'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Word Pills */}
            <div className="flex flex-wrap gap-1.5 p-2 nail-bg-subtle rounded-xl border nail-border-subtle">
              {scoreResult.wordAnalysis && scoreResult.wordAnalysis.length > 0 ? (
                scoreResult.wordAnalysis.map((item, idx) => {
                  const isCorrect = item.status === 'correct';
                  const isNeedsWork = item.status === 'needs_work';
                  return (
                    <span
                      key={idx}
                      title={item.tip || (isCorrect ? 'Phát âm tốt' : 'Cần chú ý')}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold border flex items-center space-x-1 ${
                        isCorrect
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : isNeedsWork
                          ? 'nail-badge-gold'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      <span>{item.word}</span>
                      {isCorrect ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                      )}
                    </span>
                  );
                })
              ) : (
                <p className="text-xs nail-text-muted italic">"{targetSentence}"</p>
              )}
            </div>

            {/* Transcribed speech */}
            <div className="text-xs nail-text-muted pt-1 border-t nail-border-subtle flex items-start space-x-1.5">
              <span className="font-semibold nail-text-main">Máy đã nghe:</span>
              <span className="nail-text-primary italic">
                {spokenSentence ? `"${spokenSentence}"` : '(Chưa thu âm được rõ)'}
              </span>
            </div>
          </div>

          {/* Audio Comparison Players */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePlayNative}
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded-xl nail-bg-subtle hover:nail-bg-card-hover nail-text-main border nail-border text-xs font-semibold cursor-pointer active:scale-95 transition-all"
            >
              <Volume2 className="w-4 h-4 nail-text-primary" />
              <span>{isPlayingNative ? 'Đang đọc...' : 'Giọng Bản Xứ Mỹ'}</span>
            </button>

            <button
              onClick={handlePlayUserAudio}
              disabled={!userAudioBlob}
              className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                userAudioBlob
                  ? 'nail-bg-subtle hover:nail-bg-card-hover nail-text-main border nail-border cursor-pointer active:scale-95'
                  : 'nail-bg-subtle/50 nail-text-subtle border-transparent cursor-not-allowed opacity-50'
              }`}
            >
              {isPlayingUserAudio ? (
                <>
                  <Square className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Đang nghe...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nghe Lại Giọng Bạn</span>
                </>
              )}
            </button>
          </div>

          {/* Intonation & Vietnamese Speaker Tips */}
          <div className="nail-badge-primary rounded-2xl p-3.5 space-y-2">
            <h4 className="text-xs font-bold nail-text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Mẹo phát âm cho người Việt:
            </h4>
            <p className="text-xs leading-relaxed opacity-90">
              {scoreResult.intonationFeedback}
            </p>
            {scoreResult.vietnameseSpeakerTips && scoreResult.vietnameseSpeakerTips.length > 0 && (
              <ul className="text-xs space-y-1 list-disc list-inside opacity-85">
                {scoreResult.vietnameseSpeakerTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Warm encouragement */}
          <div className="p-3 nail-bg-subtle rounded-2xl border nail-border-subtle text-xs text-emerald-400 font-semibold">
            💬 {scoreResult.encouragement}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t nail-border nail-bg-card sticky bottom-0 flex gap-2">
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 px-4 rounded-xl nail-bg-subtle hover:nail-bg-card-hover nail-text-main border nail-border font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Nói Lại Lần Nữa</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl nail-btn-primary font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tiếp Tục Học</span>
          </button>
        </div>
      </div>
    </div>
  );
};
