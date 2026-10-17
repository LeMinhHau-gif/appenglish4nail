import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  Mic,
  MicOff,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Award,
  ChevronRight,
  RefreshCw,
  Play,
  RotateCcw,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Lesson, DialogueLine, VocabItem, PronunciationScoreResult } from '../types';
import { SpeechService, AudioRecorder } from '../services/speechService';
import { GeminiService } from '../services/geminiService';
import { AIPronunciationModal } from './AIPronunciationModal';
import { SpeechSpeedControl, useSpeechSpeed } from './SpeechSpeedControl';

interface LessonDetailModalProps {
  lesson: Lesson;
  isCompleted: boolean;
  savedVocabIds: string[];
  onToggleSaveVocab: (vocabId: string) => void;
  onCompleteLesson: (lessonId: string) => void;
  onSaveRecording: (data: {
    lessonId: string;
    targetSentence: string;
    spokenSentence: string;
    score: number;
    rating: string;
    audioBlobUrl?: string;
  }) => void;
  onClose: () => void;
}

export const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  lesson,
  isCompleted,
  savedVocabIds,
  onToggleSaveVocab,
  onCompleteLesson,
  onSaveRecording,
  onClose,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dialogue' | 'vocabulary' | 'quiz' | 'summary'>('dialogue');
  const { speed } = useSpeechSpeed();

  // Audio Playback state
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);

  // Recording & AI Evaluation state
  const [recordingLineId, setRecordingLineId] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [recorderInstance, setRecorderInstance] = useState<AudioRecorder | null>(null);
  const [speechRecInstance, setSpeechRecInstance] = useState<any>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // AI Evaluation Modal
  const [evalResult, setEvalResult] = useState<PronunciationScoreResult | null>(null);
  const [evalTargetSentence, setEvalTargetSentence] = useState<string>('');

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [showQuizResults, setShowQuizResults] = useState<boolean>(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      SpeechService.stopSpeaking();
      if (recorderInstance) {
        recorderInstance.stop();
      }
      if (speechRecInstance) {
        try {
          speechRecInstance.stop();
        } catch (e) {}
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recorderInstance, speechRecInstance]);

  // Handle Play Audio with current speech speed
  const handlePlayAudio = async (text: string, id: string) => {
    if (playingLineId === id) {
      SpeechService.stopSpeaking();
      setPlayingLineId(null);
      return;
    }

    setPlayingLineId(id);
    await SpeechService.speak(text, speed, () => {
      setPlayingLineId(null);
    });
  };

  // Start Recording & Speech Recognition
  const handleStartRecording = async (line: DialogueLine) => {
    SpeechService.stopSpeaking();
    setPlayingLineId(null);
    setMicError(null);
    setRecordingLineId(line.id);
    setRecognizedText('');
    setRecordedAudioBlob(null);
    setRecordingSeconds(0);

    const recorder = new AudioRecorder();
    const startResult = await recorder.start();

    if (!startResult.success) {
      setRecordingLineId(null);
      setMicError(startResult.error || 'Không thể truy cập Microphone.');
      return;
    }

    setRecorderInstance(recorder);

    // Start timer counter
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    // Initialize speech recognition
    const rec = SpeechService.createRecognizer(
      (text, _isFinal) => {
        setRecognizedText(text);
      },
      (error) => {
        console.warn('Speech rec error:', error);
        if (error === 'not-allowed') {
          setMicError('Quyền microphone bị từ chối trên trình duyệt.');
        }
      },
      () => {
        // Recognition ended
      }
    );

    if (rec) {
      try {
        rec.start();
        setSpeechRecInstance(rec);
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  };

  // Stop Recording & Send to AI for Evaluation
  const handleStopRecording = async (line: DialogueLine) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (speechRecInstance) {
      try {
        speechRecInstance.stop();
      } catch (e) {
        console.warn(e);
      }
    }

    let audioBlob: Blob | null = null;
    if (recorderInstance) {
      audioBlob = await recorderInstance.stop();
      setRecordedAudioBlob(audioBlob);
    }

    setRecordingLineId(null);
    setIsEvaluating(true);

    const spoken = recognizedText.trim();
    const scoreData = await GeminiService.evaluatePronunciation(
      line.english,
      spoken,
      `${lesson.title} - ${line.vietnamese}`
    );

    setIsEvaluating(false);
    setEvalTargetSentence(line.english);
    setEvalResult(scoreData);

    // Persist recording history
    onSaveRecording({
      lessonId: lesson.id,
      targetSentence: line.english,
      spokenSentence: spoken || '(Chưa thu rõ âm)',
      score: scoreData.overallScore,
      rating: scoreData.accuracyRating,
      audioBlobUrl: audioBlob ? URL.createObjectURL(audioBlob) : undefined,
    });
  };

  // Handle Quiz selection
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (showQuizResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const calculateQuizScore = () => {
    let correct = 0;
    lesson.quiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return correct;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="nail-card sm:rounded-3xl w-full h-full sm:max-h-[92vh] sm:max-w-2xl flex flex-col overflow-hidden nail-text-main shadow-2xl">
        {/* Top Header */}
        <div className="p-4 border-b nail-border nail-bg-card backdrop-blur flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full nail-badge-primary">
                {lesson.categoryNameVi}
              </span>
              <span className="text-xs nail-text-muted flex items-center gap-1">
                ⏱️ {lesson.estimatedMinutes} phút
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black nail-text-main mt-0.5 line-clamp-1">
              {lesson.title}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {/* Speed Selector */}
            <SpeechSpeedControl variant="compact" />

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl nail-bg-subtle hover:nail-bg-card-hover nail-text-muted hover:nail-text-main transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b nail-border nail-bg-subtle px-2 py-1 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('dialogue')}
            className={`py-2 px-3 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'dialogue'
                ? 'nail-gradient-accent text-white font-bold shadow-xs'
                : 'nail-text-muted hover:nail-text-main'
            }`}
          >
            <span>💬 Hội Thoại Mẫu</span>
            <span className="nail-bg-card px-1.5 py-0.2 rounded-full text-[10px] nail-text-main">
              {lesson.dialogue.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('vocabulary')}
            className={`py-2 px-3 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'vocabulary'
                ? 'nail-gradient-accent text-white font-bold shadow-xs'
                : 'nail-text-muted hover:nail-text-main'
            }`}
          >
            <span>📖 Bảng Từ Vựng</span>
            <span className="nail-bg-card px-1.5 py-0.2 rounded-full text-[10px] nail-text-main">
              {lesson.vocabulary.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('quiz')}
            className={`py-2 px-3 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'quiz'
                ? 'nail-gradient-accent text-white font-bold shadow-xs'
                : 'nail-text-muted hover:nail-text-main'
            }`}
          >
            <span>🎯 Bài Tập Thực Tế</span>
            <span className="nail-bg-card px-1.5 py-0.2 rounded-full text-[10px] nail-text-main">
              {lesson.quiz.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('summary')}
            className={`py-2 px-3 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'summary'
                ? 'nail-gradient-accent text-white font-bold shadow-xs'
                : 'nail-text-muted hover:nail-text-main'
            }`}
          >
            <span>💡 Mẹo & Văn Hóa</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Microphone Error Banner */}
          {micError && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-start space-x-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Lỗi truy cập Microphone</p>
                <p className="text-[11px] mt-0.5 text-rose-200 leading-relaxed">{micError}</p>
              </div>
              <button
                onClick={() => setMicError(null)}
                className="text-rose-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: DIALOGUE */}
          {activeSubTab === 'dialogue' && (
            <div className="space-y-3.5">
              <div className="nail-badge-primary p-3 rounded-xl text-xs flex items-start space-x-2">
                <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Bấm <Volume2 className="w-3.5 h-3.5 inline mx-0.5" /> để nghe giọng Mỹ chuẩn (tốc độ đang chọn: {speed}×), hoặc bấm <Mic className="w-3.5 h-3.5 inline text-emerald-400 mx-0.5" /> để ghi âm và AI chấm điểm phát âm từng từ!
                </p>
              </div>

              {lesson.dialogue.map((line) => {
                const isTech = line.speaker === 'tech';
                const isPlaying = playingLineId === line.id;
                const isRecording = recordingLineId === line.id;

                return (
                  <div
                    key={line.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isTech
                        ? 'nail-bg-card border-2 nail-border shadow-xs'
                        : 'nail-bg-subtle nail-border-subtle'
                    }`}
                  >
                    {/* Speaker Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide ${
                            isTech
                              ? 'nail-gradient-accent text-white shadow-xs'
                              : 'nail-bg-subtle nail-text-muted border nail-border-subtle'
                          }`}
                        >
                          {isTech ? '💅 Thợ Nail (Bạn)' : '👩 Khách Mỹ (Client)'}
                        </span>
                        {line.ipa && (
                          <span className="text-[11px] nail-text-subtle font-mono hidden sm:inline">
                            {line.ipa}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handlePlayAudio(line.english, line.id)}
                          title="Nghe phát âm chuẩn Mỹ"
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isPlaying
                              ? 'nail-gradient-accent text-white border-transparent animate-pulse shadow-xs'
                              : 'nail-bg-subtle hover:nail-bg-card-hover nail-text-main nail-border'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Record Button */}
                        {isRecording ? (
                          <button
                            onClick={() => handleStopRecording(line)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs animate-pulse cursor-pointer shadow-md active:scale-95 transition-all"
                          >
                            <MicOff className="w-3.5 h-3.5" />
                            <span>Dừng ({recordingSeconds}s)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartRecording(line)}
                            disabled={isEvaluating}
                            title="Bấm để nói và AI chấm điểm phát âm"
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                          >
                            <Mic className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Luyện Nói</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* English Dialogue */}
                    <p className="text-sm sm:text-base font-extrabold nail-text-main leading-relaxed mb-1">
                      {line.english}
                    </p>

                    {/* Vietnamese Translation */}
                    <p className="text-xs sm:text-sm nail-text-muted leading-normal">
                      👉 {line.vietnamese}
                    </p>

                    {/* Tip if available */}
                    {line.tip && (
                      <p className="mt-2 text-[11px] nail-text-secondary nail-badge-gold px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium">
                        💡 {line.tip}
                      </p>
                    )}

                    {/* Real-time Recognition Box while speaking */}
                    {isRecording && (
                      <div className="mt-2.5 p-2.5 rounded-xl nail-bg-input border border-emerald-500/60 text-xs text-emerald-400 flex items-center justify-between animate-pulse">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>Đang nghe ({recordingSeconds}s): <strong>{recognizedText || '(Hãy đọc câu trên thật to rõ...)'}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Evaluating loading state */}
                    {isEvaluating && recordingLineId === null && evalTargetSentence === line.english && (
                      <div className="mt-2.5 p-2.5 rounded-xl nail-bg-input border border-theme-primary text-xs nail-text-primary flex items-center space-x-2 animate-pulse">
                        <Loader2 className="w-4 h-4 nail-text-primary animate-spin" />
                        <span>AI đang phân tích ngữ điệu và chấm điểm phát âm...</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: VOCABULARY */}
          {activeSubTab === 'vocabulary' && (
            <div className="space-y-3">
              <div className="nail-card p-3 rounded-xl border nail-border text-xs nail-text-muted flex items-center justify-between">
                <span>Bảng từ vựng cốt lõi chuyên ngành trong bài:</span>
                <span className="text-[11px] nail-text-primary font-bold">
                  {lesson.vocabulary.length} từ
                </span>
              </div>

              {lesson.vocabulary.map((vocab) => {
                const isSaved = savedVocabIds.includes(vocab.id);
                return (
                  <div
                    key={vocab.id}
                    className="p-3.5 rounded-2xl nail-card border nail-border space-y-2 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePlayAudio(vocab.word, vocab.id)}
                          className="p-1.5 rounded-lg nail-badge-primary hover:brightness-110 cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <div>
                          <h4 className="text-base font-extrabold nail-text-main leading-tight">
                            {vocab.word}
                          </h4>
                          <span className="text-xs nail-text-subtle font-mono">
                            {vocab.phonetic}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onToggleSaveVocab(vocab.id)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isSaved
                            ? 'nail-badge-gold'
                            : 'nail-bg-subtle nail-text-muted hover:nail-text-main nail-border'
                        }`}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="text-xs sm:text-sm font-semibold nail-text-secondary nail-badge-gold px-2.5 py-1 rounded-lg">
                      Nghĩa: {vocab.meaning}
                    </div>

                    <div className="nail-bg-subtle p-2.5 rounded-xl border nail-border-subtle space-y-1 text-xs">
                      <p className="nail-text-main font-medium italic">
                        "{vocab.exampleEn}"
                      </p>
                      <p className="nail-text-muted">
                        👉 {vocab.exampleVi}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: QUIZ & PRACTICAL EXERCISES */}
          {activeSubTab === 'quiz' && (
            <div className="space-y-4">
              <div className="nail-card p-3.5 rounded-xl border nail-border text-xs nail-text-muted flex items-center justify-between">
                <div>
                  <h4 className="font-bold nail-text-main text-sm">Tình Huống Giao Tiếp Thực Tế</h4>
                  <p className="nail-text-subtle text-[11px]">Chọn cách xử lý và câu nói chuẩn xác nhất</p>
                </div>
                {showQuizResults && (
                  <div className="text-xs font-black text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    Đúng: {calculateQuizScore()}/{lesson.quiz.length}
                  </div>
                )}
              </div>

              {lesson.quiz.map((q, qIndex) => {
                const userChoice = selectedAnswers[q.id];
                const isAnswered = userChoice !== undefined;

                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl nail-card border nail-border space-y-3"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase nail-badge-primary px-2 py-0.5 rounded">
                        Câu {qIndex + 1}
                      </span>
                      <p className="text-xs nail-text-secondary nail-badge-gold p-2 rounded-lg font-medium">
                        📌 {q.situation}
                      </p>
                      <h4 className="text-xs sm:text-sm font-bold nail-text-main">
                        {q.question}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        let btnStyle = 'nail-bg-subtle hover:nail-bg-card-hover nail-text-main nail-border';

                        if (showQuizResults) {
                          if (optIdx === q.correctIndex) {
                            btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                          } else if (userChoice === optIdx) {
                            btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 line-through';
                          } else {
                            btnStyle = 'nail-bg-subtle border-transparent nail-text-subtle opacity-50';
                          }
                        } else if (userChoice === optIdx) {
                          btnStyle = 'nail-badge-primary font-bold shadow-xs';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer flex items-start space-x-2.5 ${btnStyle}`}
                          >
                            <span className="font-bold shrink-0">{String.fromCharCode(65 + optIdx)}.</span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {showQuizResults && (
                      <div className="p-3 rounded-xl nail-bg-subtle border nail-border text-xs nail-text-muted space-y-1 animate-in fade-in">
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Giải thích tình huống:
                        </span>
                        <p className="nail-text-muted text-[11px] leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Quiz Submit Button */}
              <div className="pt-2">
                {!showQuizResults ? (
                  <button
                    onClick={() => setShowQuizResults(true)}
                    disabled={Object.keys(selectedAnswers).length === 0}
                    className="w-full py-3 rounded-xl nail-btn-primary font-black text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    Xem Kết Quả & Lời Giải Thích
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedAnswers({});
                      setShowQuizResults(false);
                    }}
                    className="w-full py-2.5 rounded-xl nail-bg-subtle hover:nail-bg-card-hover nail-text-main border nail-border font-bold text-xs cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm Lại Bài Tập</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SUMMARY & CULTURE */}
          {activeSubTab === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl nail-card border nail-border space-y-2">
                <span className="text-xs font-bold nail-text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Tóm tắt nội dung bài học:
                </span>
                <p className="text-xs sm:text-sm nail-text-muted leading-relaxed">
                  {lesson.summary}
                </p>
              </div>

              {/* Cultural Insight Card */}
              <div className="p-4 rounded-2xl nail-bg-subtle border nail-border space-y-2">
                <h4 className="text-xs font-bold nail-text-secondary flex items-center gap-1.5">
                  🇺🇸 Hiểu Văn Hóa Mỹ & Tâm Lý Khách:
                </h4>
                <p className="text-xs nail-text-muted leading-relaxed">
                  {lesson.culturalNote}
                </p>
              </div>

              {/* 3 Practical Rules */}
              <div className="p-4 rounded-2xl nail-card border nail-border space-y-2.5">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  🛡️ 3 Nguyên Tắc Vàng Khi Làm Nghề:
                </h4>
                <ul className="space-y-2 text-xs nail-text-muted">
                  {lesson.practicalTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">✔</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="p-4 border-t nail-border nail-bg-card sticky bottom-0 z-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs nail-text-subtle">
              Trạng thái:
            </span>
            {isCompleted ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
              </span>
            ) : (
              <span className="text-xs nail-text-secondary font-medium">Chưa hoàn thành</span>
            )}
          </div>

          <button
            onClick={() => onCompleteLesson(lesson.id)}
            className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
              isCompleted
                ? 'nail-bg-subtle nail-text-muted border nail-border hover:nail-text-main'
                : 'nail-btn-primary shadow-md'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Học Lại Bài Này' : 'Hoàn Thành (+150 XP)'}</span>
          </button>
        </div>
      </div>

      {/* AI Pronunciation Score Modal */}
      {evalResult && (
        <AIPronunciationModal
          targetSentence={evalTargetSentence}
          spokenSentence={recognizedText}
          scoreResult={evalResult}
          userAudioBlob={recordedAudioBlob}
          onClose={() => setEvalResult(null)}
          onRetry={() => {
            setEvalResult(null);
          }}
        />
      )}
    </div>
  );
};
