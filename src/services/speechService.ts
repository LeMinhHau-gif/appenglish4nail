// Web Speech Synthesis (TTS) & Web Speech Recognition (STT) + MediaRecorder
import { SpeechSpeed } from '../types';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeedOption {
  value: SpeechSpeed;
  label: string;
  shortLabel: string;
  description: string;
}

export const SPEECH_SPEED_OPTIONS: SpeedOption[] = [
  {
    value: 0.5,
    label: '0.5× — Rất chậm',
    shortLabel: '0.5×',
    description: 'Từng từ rành rọt, cực kỳ dễ nghe cho người mới',
  },
  {
    value: 0.65,
    label: '0.65× — Chậm (Khuyên dùng)',
    shortLabel: '0.65×',
    description: 'Tốc độ vàng cho học viên nail luyện khẩu hình',
  },
  {
    value: 0.75,
    label: '0.75× — Hơi chậm',
    shortLabel: '0.75×',
    description: 'Nghe rõ trọng âm và âm đuôi /s/, /t/, /d/',
  },
  {
    value: 0.85,
    label: '0.85× — Tương đối chậm',
    shortLabel: '0.85×',
    description: 'Gần với nhịp giao tiếp thực tế tại tiệm',
  },
  {
    value: 1.0,
    label: '1.0× — Bình thường',
    shortLabel: '1.0×',
    description: 'Tốc độ nói chuẩn tự nhiên của khách Mỹ',
  },
];

const SPEED_STORAGE_KEY = 'nailspeak_global_speech_speed';
const DEFAULT_SPEED: SpeechSpeed = 0.65;

export class SpeechService {
  private static synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static speedListeners: Set<(speed: SpeechSpeed) => void> = new Set();
  private static activeUtterance: SpeechSynthesisUtterance | null = null;

  // Initialize voice list & events
  static {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            SpeechService.cachedVoices = voices;
          }
        } catch (e) {
          console.warn('Could not load speech voices:', e);
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  // Get current global speech speed from localStorage
  public static getGlobalSpeed(): SpeechSpeed {
    if (typeof window === 'undefined') return DEFAULT_SPEED;
    try {
      const stored = localStorage.getItem(SPEED_STORAGE_KEY);
      if (stored) {
        const parsed = parseFloat(stored) as SpeechSpeed;
        if ([0.5, 0.65, 0.75, 0.85, 1.0].includes(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read speed from localStorage:', e);
    }
    return DEFAULT_SPEED;
  }

  // Set current global speech speed, save to storage & notify all listeners
  public static setGlobalSpeed(speed: SpeechSpeed): void {
    try {
      localStorage.setItem(SPEED_STORAGE_KEY, speed.toString());
    } catch (e) {
      console.warn('Failed to save speed to localStorage:', e);
    }

    // If currently speaking, stop to avoid overlapping with stale speed
    this.stopSpeaking();

    // Notify listeners
    this.speedListeners.forEach((listener) => {
      try {
        listener(speed);
      } catch (err) {
        console.error('Error in speed listener:', err);
      }
    });
  }

  // Subscribe to global speed updates
  public static subscribeSpeed(callback: (speed: SpeechSpeed) => void): () => void {
    this.speedListeners.add(callback);
    return () => {
      this.speedListeners.delete(callback);
    };
  }

  public static speak(text: string, customRate?: SpeechSpeed | number, onEnd?: () => void): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        console.warn('Speech synthesis not supported on this browser.');
        onEnd?.();
        resolve();
        return;
      }

      if (!text || !text.trim()) {
        onEnd?.();
        resolve();
        return;
      }

      // Stop any current utterance immediately to avoid overlapping
      this.stopSpeaking();

      const rateToUse = customRate !== undefined ? Number(customRate) : this.getGlobalSpeed();
      // Clamp rate safely between 0.5 and 1.5
      const clampedRate = Math.min(1.5, Math.max(0.5, rateToUse));

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = 'en-US';
      utterance.rate = clampedRate;
      utterance.pitch = 1.0;

      // Select high quality US voice if available
      const voices =
        this.cachedVoices.length > 0 ? this.cachedVoices : this.synth.getVoices();
      const usVoice =
        voices.find(
          (v) =>
            v.lang === 'en-US' &&
            (v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('Google') ||
              v.name.includes('Jenny') ||
              v.name.includes('Karen') ||
              v.name.includes('Ava'))
        ) ||
        voices.find((v) => v.lang === 'en-US') ||
        voices.find((v) => v.lang.startsWith('en'));

      if (usVoice) {
        utterance.voice = usVoice;
      }

      this.activeUtterance = utterance;

      utterance.onend = () => {
        if (this.activeUtterance === utterance) {
          this.activeUtterance = null;
        }
        onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        if (this.activeUtterance === utterance) {
          this.activeUtterance = null;
        }
        // If canceled explicitly, resolve quietly
        onEnd?.();
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  // Stop any active speech output
  public static stopSpeaking(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        console.warn('Error canceling speech synthesis:', e);
      }
    }
    this.activeUtterance = null;
  }

  // Check if speech synthesis is supported
  public static isSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  // Check if browser supports speech recognition
  public static isRecognitionSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }

  public static createRecognizer(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd?: () => void
  ) {
    if (!this.isRecognitionSupported()) {
      return null;
    }

    try {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRec();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        onResult(text.trim(), Boolean(finalTranscript));
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        onError(event.error);
      };

      recognition.onend = () => {
        onEnd?.();
      };

      return recognition;
    } catch (err) {
      console.warn('Failed to initialize speech recognition:', err);
      return null;
    }
  }
}

// MediaRecorder audio capture with user-friendly error translations
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  public async start(): Promise<{ success: boolean; error?: string }> {
    try {
      this.audioChunks = [];

      if (!navigator?.mediaDevices?.getUserMedia) {
        return {
          success: false,
          error: 'Trình duyệt này không hỗ trợ ghi âm micro trực tiếp.',
        };
      }

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine supported mime type
      const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      this.mediaRecorder = selectedMime
        ? new MediaRecorder(this.stream, { mimeType: selectedMime })
        : new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // 100ms chunk slices
      return { success: true };
    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      let userFriendlyMessage = 'Không thể truy cập Microphone.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userFriendlyMessage =
          'Quyền truy cập Micro bị từ chối. Vui lòng bấm vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ trình duyệt để cấp quyền micro cho ứng dụng.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userFriendlyMessage =
          'Không tìm thấy thiết bị Microphone. Vui lòng kiểm tra lại mic hoặc cắm tai nghe có mic.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        userFriendlyMessage =
          'Microphone đang bị ứng dụng khác sử dụng. Vui lòng tắt các app khác đang dùng mic.';
      }

      return { success: false, error: userFriendlyMessage };
    }
  }

  public stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.cleanup();
        resolve(audioBlob);
      };

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        this.cleanup();
        resolve(null);
      }
    });
  }

  private cleanup(): void {
    if (this.stream) {
      try {
        this.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        // ignore
      }
      this.stream = null;
    }
    this.mediaRecorder = null;
  }
}
