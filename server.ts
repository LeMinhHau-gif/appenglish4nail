import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { rbacRouter } from './server/rbacRouter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Mount RBAC and Admin management API router
app.use('/api', rbacRouter);

// Initialize Google Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// AI Pronunciation & Speaking Evaluation Endpoint
app.post('/api/evaluate-pronunciation', async (req: Request, res: Response) => {
  try {
    const { targetSentence, spokenSentence, contextInfo } = req.body;

    if (!targetSentence || typeof targetSentence !== 'string' || targetSentence.trim().length === 0) {
      return res.status(400).json({ error: 'targetSentence is required and must be a non-empty string' });
    }

    const cleanTarget = targetSentence.trim().slice(0, 500);
    const cleanSpoken = typeof spokenSentence === 'string' ? spokenSentence.trim().slice(0, 500) : '';
    const cleanContext = typeof contextInfo === 'string' ? contextInfo.trim().slice(0, 200) : 'Giao tiếp tiệm nail';

    const prompt = `
Bạn là chuyên gia giảng dạy phát âm tiếng Anh Mỹ cho thợ nail người Việt tại Hoa Kỳ.
Hãy đánh giá câu phát âm của học viên theo tiêu chuẩn giao tiếp thực tế trong tiệm nail.

- Câu mục tiêu cần nói: "${cleanTarget}"
- Lời học viên vừa nói (nhận diện qua giọng nói): "${cleanSpoken || '(Chưa nhận diện rõ câu nói)'}"
- Ngữ cảnh bài học trong tiệm nail: "${cleanContext}"

Hãy phân tích và trả về JSON chuẩn xác (không bọc trong markdown code block nếu có thể hoặc format json hợp lệ) với cấu trúc sau:
{
  "overallScore": number (từ 0 đến 100),
  "accuracyRating": "Xuất sắc" | "Tốt" | "Khá" | "Cần luyện thêm",
  "wordAnalysis": [
    {
      "word": "từ trong câu mục tiêu",
      "status": "correct" | "needs_work" | "missing",
      "tip": "Mẹo phát âm cụ thể cho người Việt nếu có (ví dụ: chú ý âm đuôi s, t, d)"
    }
  ],
  "intonationFeedback": "Nhận xét ngắn về ngữ điệu, sự tự tin và thái độ lịch sự khi nói với khách Mỹ (bằng tiếng Việt)",
  "vietnameseSpeakerTips": [
    "1-2 lời khuyên phát âm đặc trưng người Việt hay sai ở câu này (âm cuối, trọng âm, nối âm)"
  ],
  "encouragement": "Lời động viên ngắn gọn, ấm áp gửi đến anh/chị thợ nail (bằng tiếng Việt)"
}
`;

    const hasValidKey =
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY.trim().length > 10;

    if (!hasValidKey) {
      return res.json(generateLocalFallbackScore(cleanTarget, cleanSpoken));
    }

    // Call Gemini with 5s timeout to guarantee instant response
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini timeout')), 5000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

    const responseText = response.text?.trim() || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Clean up markdown if any
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    // Tag with AI assessment metadata
    parsedData.isAiAssessed = true;
    parsedData.assessmentSource = 'Gemini 3.8 Flash (Google AI)';

    return res.json(parsedData);
  } catch (error: any) {
    console.warn('Fallback evaluation due to:', error?.message || 'Error');
    // Graceful fallback so user never gets broken experience
    const fallback = generateLocalFallbackScore(
      String(req.body?.targetSentence || ''),
      String(req.body?.spokenSentence || '')
    );
    return res.json(fallback);
  }
});

// AI Simulated Client Roleplay Endpoint
app.post('/api/ai-chat-practice', async (req: Request, res: Response) => {
  try {
    const { scenarioTitle, clientPersona, conversationHistory, techMessage } = req.body;

    const cleanScenario = typeof scenarioTitle === 'string' ? scenarioTitle.trim().slice(0, 200) : 'Customer at Nail Salon';
    const cleanPersona = typeof clientPersona === 'string' ? clientPersona.trim().slice(0, 200) : 'Friendly American customer';
    const cleanTechMessage = typeof techMessage === 'string' ? techMessage.trim().slice(0, 400) : '';

    if (!cleanTechMessage) {
      return res.status(400).json({ error: 'techMessage is required' });
    }

    const systemPrompt = `
You are roleplaying as a customer (client) visiting an American nail salon.
Scenario: "${cleanScenario}".
Your persona: "${cleanPersona}".

The user is a Vietnamese nail technician practicing real-world English communication in the USA.
Respond naturally in authentic everyday American English as a salon customer would.
Keep responses concise (1 to 2 sentences max) so the technician has space to reply and practice.
After your English reply, also include a short Vietnamese translation and a helpful hint on what the tech can say next.

Return JSON in this format:
{
  "clientReplyEnglish": "Your spoken dialogue to the technician",
  "clientReplyVietnamese": "Bản dịch nghĩa tiếng Việt",
  "suggestedTechResponse": "Gợi ý câu tiếng Anh thợ nail nên đáp lại tiếp theo"
}
`;

    const hasValidKey =
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY.trim().length > 10;

    if (!hasValidKey) {
      return res.json({
        clientReplyEnglish: "That looks so much better! Thank you for taking the time to fix it.",
        clientReplyVietnamese: "Trông đẹp hơn nhiều rồi! Cảm ơn em đã bỏ thời gian sửa lại nhé.",
        suggestedTechResponse: "You're very welcome! Thanks for giving me the chance to make it right."
      });
    }

    const safeHistory = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-8).map((m: any) => `${m.role === 'tech' ? 'Technician' : 'Customer'}: ${String(m.text || '').slice(0, 300)}`)
      : [];

    const prompt = `${safeHistory.join('\n')}\nTechnician: ${cleanTechMessage}\nCustomer:`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini timeout')), 5000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

    const responseText = response.text?.trim() || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.warn('AI roleplay fallback due to:', error?.message || 'Error');
    return res.json({
      clientReplyEnglish: "Thank you for explaining that, I really appreciate your help!",
      clientReplyVietnamese: "Cảm ơn em đã giải thích, chị rất trân trọng sự chu đáo của em!",
      suggestedTechResponse: "You're very welcome! I just want to make sure your nails are healthy."
    });
  }
});

// Local fallback scoring algorithm based on word token similarity & phonetics
function generateLocalFallbackScore(target: string, spoken: string) {
  if (!spoken || spoken.trim().length === 0) {
    const targetWords = target.split(/\s+/).filter(Boolean);
    return {
      overallScore: 20,
      accuracyRating: 'Cần luyện thêm',
      isAiAssessed: false,
      assessmentSource: 'Thuật toán đối chiếu tham khảo (Chưa có âm thanh rõ)',
      wordAnalysis: targetWords.map((w) => ({
        word: w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ''),
        status: 'missing',
        tip: 'Chưa thu được âm thanh rõ. Hãy bấm micro và nói to hơn nhé.',
      })),
      intonationFeedback: 'Chưa nhận diện được giọng nói. Anh/chị hãy bấm micro và đọc to rõ ràng.',
      vietnameseSpeakerTips: [
        'Nói gần mic hơn hoặc kiểm tra quyền truy cập microphone trên trình duyệt.',
        'Đọc chậm rãi từng cụm từ để hệ thống nhận diện chuẩn xác nhất.',
      ],
      encouragement: 'Không sao cả! Hãy bấm thử lại và đọc từng từ thật tự tin nhé!',
    };
  }

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const tWords = clean(target).split(/\s+/).filter(Boolean);
  const sWords = clean(spoken).split(/\s+/).filter(Boolean);

  let matchCount = 0;
  const wordAnalysis = tWords.map((tw) => {
    const foundExact = sWords.includes(tw);
    const foundPartial = sWords.some(
      (sw) => sw.startsWith(tw) || tw.startsWith(sw) || levenshteinDistance(sw, tw) <= 1
    );

    if (foundExact) {
      matchCount += 1;
      return { word: tw, status: 'correct', tip: 'Phát âm chuẩn xác!' };
    } else if (foundPartial) {
      matchCount += 0.7;
      return {
        word: tw,
        status: 'needs_work',
        tip: tw.endsWith('s')
          ? 'Chú ý xì âm gió /s/ ở đuôi từ'
          : tw.endsWith('t') || tw.endsWith('d')
          ? 'Bật nhẹ âm kết thúc /t/ hoặc /d/'
          : 'Cố gắng phát âm rõ nguyên âm hơn',
      };
    } else {
      return {
        word: tw,
        status: 'missing',
        tip: 'Từ này bị lướt qua hoặc phát âm chưa rõ.',
      };
    }
  });

  const percentage = Math.min(100, Math.round((matchCount / Math.max(1, tWords.length)) * 100));
  let rating = 'Cần luyện thêm';
  if (percentage >= 85) rating = 'Xuất sắc';
  else if (percentage >= 70) rating = 'Tốt';
  else if (percentage >= 50) rating = 'Khá';

  return {
    overallScore: percentage,
    accuracyRating: rating,
    isAiAssessed: false,
    assessmentSource: 'Thuật toán đối chiếu tham khảo (Chế độ ngoại tuyến)',
    wordAnalysis,
    intonationFeedback:
      percentage >= 80
        ? 'Giọng điệu rất tự nhiên, âm lượng và nhịp điệu phù hợp trong không gian tiệm nail chuyên nghiệp.'
        : 'Ngữ điệu khá tốt, cần giữ hơi đều đặn và tự tin hơn ở cuối câu.',
    vietnameseSpeakerTips: [
      'Người Việt hay quên bật âm gió cuối như /s/, /z/, /t/, /d/. Hãy phát âm rõ đuôi từ.',
      'Nhấn trọng âm vào từ khóa quan trọng để khách Mỹ nghe bắt ý nhanh nhất.',
    ],
    encouragement:
      percentage >= 80
        ? 'Làm tốt lắm! Khách Mỹ nghe câu này chắc chắn sẽ rất tin tưởng và hài lòng.'
        : 'Rất tuyệt vời! Chỉ cần luyện thêm vài lần là phát âm sẽ mượt mà như người bản xứ.',
  };
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Start development or production server
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
