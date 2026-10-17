import { PronunciationScoreResult } from '../types';

export class GeminiService {
  public static async evaluatePronunciation(
    targetSentence: string,
    spokenSentence: string,
    contextInfo: string
  ): Promise<PronunciationScoreResult> {
    try {
      const response = await fetch('/api/evaluate-pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSentence, spokenSentence, contextInfo }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Network error or server unavailable, running local evaluation fallback:', error);
      return this.localEvaluateFallback(targetSentence, spokenSentence);
    }
  }

  public static async getAiRoleplayReply(
    scenarioTitle: string,
    clientPersona: string,
    conversationHistory: { role: 'tech' | 'client'; text: string }[],
    techMessage: string
  ): Promise<{ clientReplyEnglish: string; clientReplyVietnamese: string; suggestedTechResponse: string }> {
    try {
      const response = await fetch('/api/ai-chat-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioTitle,
          clientPersona,
          conversationHistory,
          techMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('AI roleplay fallback:', error);
      return {
        clientReplyEnglish: "That looks so much better! Thank you for taking the time to fix it.",
        clientReplyVietnamese: "Trông đẹp hơn nhiều rồi! Cảm ơn em đã bỏ thời gian sửa lại nhé.",
        suggestedTechResponse: "You're very welcome! Thanks for giving me the chance to make it right."
      };
    }
  }

  public static async chatWithAiSalonClient(
    scenarioTitle: string,
    clientPersona: string,
    conversationHistory: { role: 'tech' | 'client'; text: string }[],
    techMessage: string
  ): Promise<{ clientReplyEnglish: string; clientReplyVietnamese: string; suggestedTechResponse: string }> {
    return this.getAiRoleplayReply(scenarioTitle, clientPersona, conversationHistory, techMessage);
  }

  private static localEvaluateFallback(target: string, spoken: string): PronunciationScoreResult {
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const tWords = clean(target).split(/\s+/).filter(Boolean);
    const sWords = clean(spoken).split(/\s+/).filter(Boolean);

    let matchCount = 0;
    const wordAnalysis = tWords.map((tw) => {
      const found = sWords.includes(tw);
      if (found) {
        matchCount++;
        return { word: tw, status: 'correct' as const, tip: 'Phát âm tốt!' };
      }
      return {
        word: tw,
        status: 'needs_work' as const,
        tip: tw.endsWith('s')
          ? 'Nhớ xì âm gió /s/ ở đuôi'
          : tw.endsWith('t') || tw.endsWith('d')
          ? 'Bật nhẹ âm cuối /t/, /d/'
          : 'Luyện đọc rõ nguyên âm',
      };
    });

    const score = Math.min(100, Math.round((matchCount / Math.max(1, tWords.length)) * 100));
    let rating = 'Cần luyện thêm';
    if (score >= 85) rating = 'Xuất sắc';
    else if (score >= 70) rating = 'Tốt';
    else if (score >= 50) rating = 'Khá';

    return {
      overallScore: score,
      accuracyRating: rating,
      wordAnalysis,
      intonationFeedback:
        score >= 75
          ? 'Ngữ điệu tự nhiên, phong thái lịch sự và tự tin khi giao tiếp trong tiệm.'
          : 'Cần phát âm dứt khoát hơn và giữ nhịp điệu đều đặn.',
      vietnameseSpeakerTips: [
        'Chú ý bật các âm cuối (ending sounds): /s/, /z/, /t/, /d/ để khách Mỹ nghe rõ ràng.',
        'Đọc nối âm nhẹ nhàng giữa các từ (linking words).',
      ],
      encouragement:
        score >= 75
          ? 'Rất tuyệt vời! Giọng nói tự tin này sẽ giúp chị lấy lòng khách Mỹ rất dễ dàng.'
          : 'Chỉ cần luyện thêm vài lần nữa là phát âm sẽ chuẩn như người bản xứ!',
    };
  }
}
