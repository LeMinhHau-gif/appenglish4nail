import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  RefreshCw,
  Send,
  MessageSquare,
  Bot,
  User,
  Lightbulb,
  CheckCircle2,
  Award,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Loader2
} from 'lucide-react';
import { SpeechService, AudioRecorder } from '../services/speechService';
import { GeminiService } from '../services/geminiService';
import { AIPronunciationModal } from './AIPronunciationModal';
import { PronunciationScoreResult } from '../types';
import { SpeechSpeedControl, useSpeechSpeed } from './SpeechSpeedControl';

interface RoleplayScenario {
  id: string;
  category: string;
  title: string;
  clientPersona: string;
  initialClientMessage: string;
  initialClientMessageVi: string;
  initialTechSuggestion: string;
  initialTechSuggestionVi: string;
  helpfulPhrases: { en: string; vi: string }[];
}

const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'sc-1',
    category: 'Xử lý phàn nàn',
    title: 'Khách chê thợ làm nhanh, làm ẩu',
    clientPersona: 'A customer who noticed uneven polish and rough edges and feels rushed',
    initialClientMessage: "Excuse me, you're going way too fast! The polish looks uneven and the cuticles are messy.",
    initialClientMessageVi: 'Xin lỗi, em làm nhanh quá vậy! Nước sơn nhìn không đều còn viền da thì luộm thuộm.',
    initialTechSuggestion: "You're right, I'm sorry. I was going too fast. Let me slow down and clean up the edges for you.",
    initialTechSuggestionVi: 'Chị nói đúng, em xin lỗi chị. Em sơ suất làm hơi nhanh. Để em làm chậm lại và dọn sạch viền cho chị nhé.',
    helpfulPhrases: [
      { en: "I'm going to take my time on this.", vi: 'Em sẽ làm thật thong thả, kỹ càng.' },
      { en: "There's no extra charge for fixing this.", vi: 'Phần sửa này hoàn toàn miễn phí ạ.' },
      { en: "Thanks for giving me the chance to make it right.", vi: 'Cảm ơn chị đã cho em cơ hội sửa lại.' },
    ],
  },
  {
    id: 'sc-2',
    category: 'Đón tiếp & Chào hỏi',
    title: 'Thợ mới đón khách & hỏi thói quen',
    clientPersona: 'A first-time customer looking for a reliable, friendly technician',
    initialClientMessage: "Hi there! I have an appointment for two o'clock. It's my first time here.",
    initialClientMessageVi: 'Chào em! Chị có hẹn lúc 2 giờ. Đây là lần đầu chị ghé tiệm mình.',
    initialTechSuggestion: "Hi! My name is Lily, and I'll be taking care of you today. What service do you usually get done?",
    initialTechSuggestionVi: 'Chào chị! Em tên là Lily, hôm nay em sẽ phục vụ chị. Bình thường chị hay làm dịch vụ gì ạ?',
    helpfulPhrases: [
      { en: "It's really nice to meet you!", vi: 'Rất vui được gặp chị!' },
      { en: "I've been doing nails for eight years.", vi: 'Em làm nghề được tám năm rồi ạ.' },
      { en: "Please tell me if you like anything done a certain way.", vi: 'Chị thích làm kiểu gì cứ dặn em nhé.' },
    ],
  },
  {
    id: 'sc-3',
    category: 'Tư vấn kiểu dáng',
    title: 'Tư vấn form móng & độ dài phù hợp',
    clientPersona: 'An office worker typing on computer all day, deciding on shape',
    initialClientMessage: "I want to try something new today, but I type on a keyboard all day for work. What shape do you recommend?",
    initialClientMessageVi: 'Hôm nay chị muốn đổi kiểu mới, nhưng đi làm chị phải gõ phím cả ngày. Em tư vấn dáng nào hợp?',
    initialTechSuggestion: "A short squoval or short almond works great if you're on a keyboard all day! It's stylish and very comfortable.",
    initialTechSuggestionVi: 'Form squoval hoặc almond ngắn rất hợp nếu chị gõ máy tính cả ngày! Vừa đẹp sang vừa gõ phím rất êm tay.',
    helpfulPhrases: [
      { en: "Is this length going to be comfortable for work?", vi: 'Độ dài này đi làm chị thấy thoải mái không?' },
      { en: "Do you like them more rounded or more square?", vi: 'Chị thích bo tròn hay vuông hơn?' },
    ],
  },
  {
    id: 'sc-4',
    category: 'Chọn màu & Xu hướng',
    title: 'Gợi ý hiệu ứng mắt mèo (Cat-eye) & Chrome',
    clientPersona: 'A customer looking at color swatches, hesitant to try nail art',
    initialClientMessage: "I usually just get plain light pink, but I'm feeling a little bored with it.",
    initialClientMessageVi: 'Bình thường chị chỉ sơn màu hồng nhạt, nhưng dạo này thấy hơi chán chán.',
    initialTechSuggestion: "Have you seen the cat-eye magnetic gel trending right now? It catches the light so beautifully and it's just a fifteen-dollar add-on!",
    initialTechSuggestionVi: 'Chị đã thấy kiểu gel mắt mèo nam châm đang hot trend chưa ạ? Bắt sáng lấp lánh cực đẹp mà chỉ thêm mười lăm đô thôi!',
    helpfulPhrases: [
      { en: "Want to try it on just one accent nail first?", vi: 'Chị muốn thử trước trên một ngón điểm nhấn không?' },
      { en: "It lasts just as long as regular gel.", vi: 'Độ bền lâu y như gel thường ạ.' },
    ],
  },
  {
    id: 'sc-5',
    category: 'Kỹ thuật & An toàn',
    title: 'Từ chối dao cạo gót chân (Credo Blade)',
    clientPersona: 'A pedicure client asking for a razor blade to remove thick calluses',
    initialClientMessage: "Can you use the razor blade on my heels? They're super cracked and rough.",
    initialClientMessageVi: 'Em dùng dao cạo gót cho chị được không? Gót chân chị nứt với ráp lắm.',
    initialTechSuggestion: "State board regulations don't allow razor blades for safety reasons, but our callus treatment and foot file will leave your heels completely smooth!",
    initialTechSuggestionVi: 'Luật State Board cấm dùng dao cạo để đảm bảo an toàn cho khách ạ, nhưng gói ủ mềm da chết và dũa mịn của tiệm em sẽ giúp gót chân chị láng o luôn!',
    helpfulPhrases: [
      { en: "Your health and safety always come first.", vi: 'Sức khỏe và an toàn của chị luôn là số một.' },
      { en: "I'll do an extra scrub for you.", vi: 'Em sẽ chà kỹ thêm một chút cho chị nhé.' },
    ],
  },
];

interface ChatMessage {
  role: 'client' | 'tech';
  text: string;
  vi?: string;
}

interface VoicePracticeViewProps {
  onSaveRecording: (data: {
    lessonId: string;
    targetSentence: string;
    spokenSentence: string;
    score: number;
    rating: string;
    audioBlobUrl?: string;
  }) => void;
}

export const VoicePracticeView: React.FC<VoicePracticeViewProps> = ({ onSaveRecording }) => {
  const { speed } = useSpeechSpeed();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('sc-1');
  const currentScenario =
    ROLEPLAY_SCENARIOS.find((s) => s.id === selectedScenarioId) || ROLEPLAY_SCENARIOS[0];

  // Chat conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'client',
      text: currentScenario.initialClientMessage,
      vi: currentScenario.initialClientMessageVi,
    },
  ]);

  // Suggested reply
  const [suggestedReply, setSuggestedReply] = useState<string>(
    currentScenario.initialTechSuggestion
  );
  const [suggestedReplyVi, setSuggestedReplyVi] = useState<string>(
    currentScenario.initialTechSuggestionVi
  );

  // User input text
  const [techInput, setTechInput] = useState<string>('');

  // Audio & Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [recorderInstance, setRecorderInstance] = useState<AudioRecorder | null>(null);
  const [speechRecInstance, setSpeechRecInstance] = useState<any>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [lastAudioBlob, setLastAudioBlob] = useState<Blob | null>(null);

  // AI Pronunciation Modal
  const [evalResult, setEvalResult] = useState<PronunciationScoreResult | null>(null);
  const [evalTarget, setEvalTarget] = useState<string>('');
  const [evalSpoken, setEvalSpoken] = useState<string>('');

  const timerRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiResponding]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      SpeechService.stopSpeaking();
      if (recorderInstance) recorderInstance.stop();
      if (speechRecInstance) {
        try {
          speechRecInstance.stop();
        } catch (e) {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recorderInstance, speechRecInstance]);

  // Select Scenario
  const handleSelectScenario = (scId: string) => {
    SpeechService.stopSpeaking();
    setSelectedScenarioId(scId);
    const sc = ROLEPLAY_SCENARIOS.find((s) => s.id === scId) || ROLEPLAY_SCENARIOS[0];
    setMessages([
      {
        role: 'client',
        text: sc.initialClientMessage,
        vi: sc.initialClientMessageVi,
      },
    ]);
    setSuggestedReply(sc.initialTechSuggestion);
    setSuggestedReplyVi(sc.initialTechSuggestionVi);
    setTechInput('');
  };

  // Reset current conversation
  const handleResetChat = () => {
    SpeechService.stopSpeaking();
    setMessages([
      {
        role: 'client',
        text: currentScenario.initialClientMessage,
        vi: currentScenario.initialClientMessageVi,
      },
    ]);
    setSuggestedReply(currentScenario.initialTechSuggestion);
    setSuggestedReplyVi(currentScenario.initialTechSuggestionVi);
    setTechInput('');
  };

  // Play audio of a sentence with current speech speed
  const handlePlayAudio = (text: string) => {
    SpeechService.speak(text, speed);
  };

  // Start Voice Recording
  const handleStartRecording = async () => {
    SpeechService.stopSpeaking();
    setMicError(null);
    setTechInput('');
    setRecordingSeconds(0);

    const recorder = new AudioRecorder();
    const startRes = await recorder.start();
    if (!startRes.success) {
      setMicError(startRes.error || 'Không thể truy cập microphone.');
      return;
    }

    setRecorderInstance(recorder);
    setIsRecording(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    // Start Web Speech Recognition
    const rec = SpeechService.createRecognizer(
      (text) => {
        setTechInput(text);
      },
      (error) => {
        console.warn('Speech rec error:', error);
      }
    );

    if (rec) {
      try {
        rec.start();
        setSpeechRecInstance(rec);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Stop Recording and Send to AI Roleplay
  const handleStopRecordingAndSend = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (speechRecInstance) {
      try {
        speechRecInstance.stop();
      } catch (e) {}
    }

    let audioBlob: Blob | null = null;
    if (recorderInstance) {
      audioBlob = await recorderInstance.stop();
      setLastAudioBlob(audioBlob);
    }

    setIsRecording(false);

    const spokenText = techInput.trim() || suggestedReply;
    if (!spokenText) return;

    // Evaluate pronunciation if user spoke
    const targetRef = suggestedReply || spokenText;
    const scoreData = await GeminiService.evaluatePronunciation(
      targetRef,
      spokenText,
      `Tình huống: ${currentScenario.title}`
    );

    setEvalTarget(targetRef);
    setEvalSpoken(spokenText);
    setEvalResult(scoreData);

    onSaveRecording({
      lessonId: currentScenario.id,
      targetSentence: targetRef,
      spokenSentence: spokenText,
      score: scoreData.overallScore,
      rating: scoreData.accuracyRating,
      audioBlobUrl: audioBlob ? URL.createObjectURL(audioBlob) : undefined,
    });

    // Append Tech message
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        role: 'tech',
        text: spokenText,
      },
    ];
    setMessages(newMessages);
    setTechInput('');
    setIsAiResponding(true);

    // Call AI to generate next Client reply
    const aiData = await GeminiService.chatWithAiSalonClient(
      currentScenario.title,
      currentScenario.clientPersona,
      newMessages,
      spokenText
    );
    setIsAiResponding(false);

    setMessages([
      ...newMessages,
      {
        role: 'client',
        text: aiData.clientReplyEnglish,
        vi: aiData.clientReplyVietnamese,
      },
    ]);

    if (aiData.suggestedTechResponse) {
      setSuggestedReply(aiData.suggestedTechResponse);
      setSuggestedReplyVi('');
    }
  };

  // Handle typing send
  const handleSendTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techInput.trim() || isAiResponding) return;
    handleStopRecordingAndSend();
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
      {/* Header card with Scenario selector & Speed selector */}
      <div className="p-4 rounded-3xl nail-card border nail-border shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl nail-gradient-accent flex items-center justify-center text-white shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black nail-text-main">Phòng Luyện Nói AI (Roleplay)</h2>
              <p className="text-xs nail-text-muted">Đối thoại 2 chiều thực tế với khách hàng Mỹ</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <SpeechSpeedControl variant="compact" />
            <button
              onClick={handleResetChat}
              title="Khởi động lại cuộc trò chuyện"
              className="p-1.5 rounded-xl nail-bg-subtle hover:nail-bg-card-hover nail-text-muted hover:nail-text-main border nail-border cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scenario selector */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider nail-text-subtle block mb-1.5">
            Tình huống giao tiếp tiệm nail:
          </label>
          <div className="relative">
            <select
              value={selectedScenarioId}
              onChange={(e) => handleSelectScenario(e.target.value)}
              className="w-full nail-bg-input border nail-border rounded-xl px-3.5 py-2.5 text-xs nail-text-main font-bold focus:outline-none focus:border-theme-primary appearance-none cursor-pointer"
            >
              {ROLEPLAY_SCENARIOS.map((sc, idx) => (
                <option key={sc.id} value={sc.id}>
                  {idx + 1}. [{sc.category}] {sc.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 nail-text-subtle absolute right-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Helpful expression chips for this scenario */}
        <div className="pt-1">
          <span className="text-[10px] font-bold nail-text-subtle uppercase tracking-wide block mb-1.5">
            Mẫu câu đắt giá nên dùng:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {currentScenario.helpfulPhrases.map((phrase, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => {
                  setTechInput(phrase.en);
                  handlePlayAudio(phrase.en);
                }}
                title={phrase.vi}
                className="text-[11px] px-2.5 py-1 rounded-lg nail-badge-primary font-medium flex items-center space-x-1 cursor-pointer transition-all active:scale-95 hover:brightness-110"
              >
                <span>{phrase.en}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Microphone Error Alert */}
      {micError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-start space-x-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Chưa thể ghi âm microphone</p>
            <p className="text-[11px] mt-0.5 text-rose-200 leading-relaxed">{micError}</p>
          </div>
          <button
            onClick={() => setMicError(null)}
            className="text-rose-400 hover:text-white p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Interactive Chat Stream */}
      <div className="nail-card border nail-border rounded-3xl p-4 min-h-[320px] max-h-[460px] overflow-y-auto space-y-3.5 shadow-inner">
        {messages.map((m, idx) => {
          const isClient = m.role === 'client';
          return (
            <div
              key={idx}
              className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
            >
              <div className="flex items-center space-x-1.5 mb-1 px-1">
                {isClient ? (
                  <>
                    <span className="text-[10px] font-bold nail-text-secondary uppercase tracking-wide">
                      👩 Khách Mỹ (Client)
                    </span>
                    <button
                      onClick={() => handlePlayAudio(m.text)}
                      title="Nghe khách nói"
                      className="nail-text-subtle hover:nail-text-main cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-bold nail-text-primary uppercase tracking-wide">
                      💅 Bạn (Nail Tech)
                    </span>
                    <button
                      onClick={() => handlePlayAudio(m.text)}
                      title="Nghe lại câu nói"
                      className="nail-text-subtle hover:nail-text-main cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed border ${
                  isClient
                    ? 'nail-bg-subtle nail-border-subtle nail-text-main rounded-tl-xs'
                    : 'nail-gradient-accent text-white border-transparent rounded-tr-xs shadow-md nail-shadow-glow'
                }`}
              >
                <p className="font-semibold">{m.text}</p>
                {m.vi && (
                  <p className="text-[11px] opacity-80 border-t border-current/20 pt-1.5 mt-1.5">
                    👉 {m.vi}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {isAiResponding && (
          <div className="flex items-center space-x-2 text-xs nail-text-muted p-2 italic animate-pulse">
            <Loader2 className="w-4 h-4 nail-text-primary animate-spin" />
            <span>Khách hàng đang lắng nghe và phản hồi...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Reply Box */}
      <div className="p-3.5 rounded-2xl nail-card border nail-border nail-badge-gold text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold flex items-center gap-1.5 nail-text-secondary">
            <Lightbulb className="w-3.5 h-3.5" /> Gợi ý câu nên đáp lại:
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePlayAudio(suggestedReply)}
              className="flex items-center space-x-1 nail-text-secondary hover:brightness-125 font-semibold cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Nghe mẫu</span>
            </button>
          </div>
        </div>
        <p className="font-extrabold nail-text-main text-xs sm:text-sm italic">
          "{suggestedReply}"
        </p>
        {suggestedReplyVi && (
          <p className="text-[11px] nail-text-muted">
            👉 {suggestedReplyVi}
          </p>
        )}
      </div>

      {/* Voice & Input Controls */}
      <div className="nail-card border nail-border rounded-3xl p-3.5 space-y-3">
        {/* Realtime voice transcription status */}
        {isRecording && (
          <div className="p-3 rounded-2xl nail-bg-input border border-emerald-500 text-xs text-emerald-400 flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Đang thu ({recordingSeconds}s): <strong>{techInput || '(Hãy nói vào micro...)'}</strong></span>
            </div>
            <button
              type="button"
              onClick={handleStopRecordingAndSend}
              className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-400 cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        )}

        <form onSubmit={handleSendTyped} className="flex items-center space-x-2">
          {isRecording ? (
            <button
              type="button"
              onClick={handleStopRecordingAndSend}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-lg flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-95"
            >
              <MicOff className="w-4 h-4" />
              <span>Dừng Nói & Chấm Điểm AI ({recordingSeconds}s)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartRecording}
              disabled={isAiResponding}
              className="flex-1 py-3 px-4 rounded-2xl nail-btn-primary font-black text-xs flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Mic className="w-4 h-4" />
              <span>Bấm Để Thu Âm & Luyện Nói Với Khách</span>
            </button>
          )}

          {/* Quick Speak Native Button */}
          <button
            type="button"
            onClick={() => {
              setTechInput(suggestedReply);
              handleStopRecordingAndSend();
            }}
            title="Gửi nhanh câu gợi ý"
            className="p-3 rounded-2xl nail-bg-subtle hover:nail-bg-card-hover nail-text-main border nail-border cursor-pointer active:scale-95 transition-all"
          >
            <Send className="w-4 h-4 nail-text-primary" />
          </button>
        </form>
      </div>

      {/* AI Pronunciation Score Modal */}
      {evalResult && (
        <AIPronunciationModal
          targetSentence={evalTarget}
          spokenSentence={evalSpoken}
          scoreResult={evalResult}
          userAudioBlob={lastAudioBlob}
          onClose={() => setEvalResult(null)}
          onRetry={() => {
            setEvalResult(null);
            handleStartRecording();
          }}
        />
      )}
    </div>
  );
};
