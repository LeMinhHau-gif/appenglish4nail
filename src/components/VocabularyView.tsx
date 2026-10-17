import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Bookmark,
  BookmarkCheck,
  Search,
  Layers,
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { NAIL_LESSONS } from '../data/nailCurriculum';
import { VocabItem } from '../types';
import { SpeechService } from '../services/speechService';
import { SpeechSpeedControl, useSpeechSpeed } from './SpeechSpeedControl';

interface VocabularyViewProps {
  savedVocabIds: string[];
  onToggleSaveVocab: (vocabId: string) => void;
}

export const VocabularyView: React.FC<VocabularyViewProps> = ({
  savedVocabIds,
  onToggleSaveVocab,
}) => {
  const { speed } = useSpeechSpeed();

  // Extract all vocabulary items with their parent lesson title
  const allVocab: (VocabItem & { lessonTitle: string })[] = React.useMemo(() => {
    const list: (VocabItem & { lessonTitle: string })[] = [];
    NAIL_LESSONS.forEach((lesson) => {
      lesson.vocabulary.forEach((item) => {
        list.push({ ...item, lessonTitle: lesson.title });
      });
    });
    return list;
  }, []);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSavedOnly, setFilterSavedOnly] = useState<boolean>(false);
  const [isFlashcardMode, setIsFlashcardMode] = useState<boolean>(false);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      SpeechService.stopSpeaking();
    };
  }, []);

  // Filtered vocabulary list
  const filteredVocab = allVocab.filter((item) => {
    const matchesSearch =
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSaved = filterSavedOnly ? savedVocabIds.includes(item.id) : true;
    return matchesSearch && matchesSaved;
  });

  const handlePlayAudio = (word: string) => {
    SpeechService.speak(word, speed);
  };

  const currentFlashcard = filteredVocab[currentCardIndex] || filteredVocab[0];

  const handleNextCard = () => {
    setIsCardFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % Math.max(1, filteredVocab.length));
  };

  const handlePrevCard = () => {
    setIsCardFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + filteredVocab.length) % Math.max(1, filteredVocab.length));
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
      {/* Top Banner & Mode Toggle */}
      <div className="p-4 rounded-3xl nail-card border nail-border shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-black nail-text-main flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 nail-text-primary" /> Bảng Từ Vựng Tiệm Nail
          </h2>
          <p className="text-xs nail-text-muted">
            {allVocab.length} từ vựng chuyên ngành thông dụng nhất tại Mỹ
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <SpeechSpeedControl variant="compact" />
          <button
            onClick={() => {
              setIsFlashcardMode(!isFlashcardMode);
              setIsCardFlipped(false);
            }}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
              isFlashcardMode
                ? 'nail-btn-primary shadow-xs'
                : 'nail-bg-subtle hover:nail-bg-card-hover nail-text-main nail-border'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isFlashcardMode ? 'Danh Sách' : 'Flashcard'}</span>
          </button>
        </div>
      </div>

      {/* FLASHCARD MODE */}
      {isFlashcardMode ? (
        <div className="space-y-4">
          {filteredVocab.length === 0 ? (
            <div className="p-8 text-center nail-text-muted text-xs nail-card rounded-2xl">
              Không tìm thấy từ vựng nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Card counter */}
              <div className="flex items-center justify-between text-xs nail-text-muted px-2 font-medium">
                <span>
                  Thẻ {currentCardIndex + 1} / {filteredVocab.length}
                </span>
                <span className="nail-text-primary font-bold">{currentFlashcard.lessonTitle}</span>
              </div>

              {/* Big Interactive Flip Card */}
              <div
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className={`min-h-[260px] p-6 rounded-3xl border transition-all duration-300 cursor-pointer shadow-xl flex flex-col justify-between select-none ${
                  isCardFlipped
                    ? 'nail-card border-2 border-theme-primary nail-shadow-glow'
                    : 'nail-card border nail-border'
                }`}
              >
                {/* Card Top */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full nail-badge-primary">
                    {isCardFlipped ? 'Mặt Sau: Nghĩa & Ví Dụ' : 'Mặt Trước: Tiếng Anh'}
                  </span>
                  <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handlePlayAudio(currentFlashcard.word)}
                      className="p-2 rounded-xl nail-bg-subtle hover:nail-bg-card-hover nail-text-primary border nail-border cursor-pointer transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onToggleSaveVocab(currentFlashcard.id)}
                      className="p-2 rounded-xl nail-bg-subtle hover:nail-bg-card-hover nail-text-secondary border nail-border cursor-pointer transition-colors"
                    >
                      {savedVocabIds.includes(currentFlashcard.id) ? (
                        <BookmarkCheck className="w-4 h-4 fill-current" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Center Content */}
                <div className="text-center py-6 space-y-2">
                  {!isCardFlipped ? (
                    <>
                      <h3 className="text-2xl sm:text-3xl font-black tracking-tight nail-text-main">
                        {currentFlashcard.word}
                      </h3>
                      <p className="text-sm nail-text-subtle font-mono">
                        {currentFlashcard.phonetic}
                      </p>
                      <p className="text-xs nail-text-primary mt-3 flex items-center justify-center gap-1 font-bold">
                        <RotateCw className="w-3.5 h-3.5" /> Bấm vào thẻ để lật xem nghĩa
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-xl font-bold nail-text-primary">
                        {currentFlashcard.meaning}
                      </h4>
                      <div className="nail-bg-subtle p-3 rounded-xl border nail-border-subtle text-left space-y-1 text-xs mt-3">
                        <p className="nail-text-main font-medium italic">
                          "{currentFlashcard.exampleEn}"
                        </p>
                        <p className="nail-text-muted">
                          👉 {currentFlashcard.exampleVi}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Card Bottom hint */}
                <div className="text-center text-[11px] nail-text-subtle font-medium">
                  Chạm để lật thẻ • Bấm loa để nghe phát âm chuẩn ({speed}×)
                </div>
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handlePrevCard}
                  className="py-2.5 px-4 rounded-xl nail-bg-subtle hover:nail-bg-card-hover nail-text-main border nail-border font-bold text-xs flex items-center space-x-1 cursor-pointer active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Từ Trước</span>
                </button>

                <button
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className="py-2.5 px-4 rounded-xl nail-bg-subtle hover:nail-bg-card-hover nail-text-primary border nail-border font-bold text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Lật Thẻ</span>
                </button>

                <button
                  onClick={handleNextCard}
                  className="py-2.5 px-4 rounded-xl nail-btn-primary font-bold text-xs shadow-md flex items-center space-x-1 cursor-pointer active:scale-95 transition-all"
                >
                  <span>Từ Kế Tiếp</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* LIST MODE */
        <div className="space-y-3.5">
          {/* Search bar & filter pills */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 nail-text-subtle absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full nail-bg-input border nail-border rounded-xl pl-9 pr-3 py-2 text-xs nail-text-main placeholder:nail-text-subtle focus:outline-none focus:border-theme-primary"
              />
            </div>

            <button
              onClick={() => setFilterSavedOnly(!filterSavedOnly)}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-all ${
                filterSavedOnly
                  ? 'nail-badge-gold shadow-xs'
                  : 'nail-bg-card nail-text-muted border nail-border hover:nail-text-main'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Đã Lưu ({savedVocabIds.length})</span>
            </button>
          </div>

          {/* Vocabulary List Items */}
          <div className="space-y-2.5">
            {filteredVocab.map((item) => {
              const isSaved = savedVocabIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl nail-card border nail-border transition-all space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <button
                        onClick={() => handlePlayAudio(item.word)}
                        className="p-2 rounded-xl nail-badge-primary hover:brightness-110 cursor-pointer transition-all active:scale-95"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm sm:text-base font-extrabold nail-text-main">
                            {item.word}
                          </h4>
                          <span className="text-[11px] nail-text-subtle font-mono">
                            {item.phonetic}
                          </span>
                        </div>
                        <p className="text-xs font-bold nail-text-primary mt-0.5">
                          {item.meaning}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleSaveVocab(item.id)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isSaved
                          ? 'nail-badge-gold'
                          : 'nail-bg-subtle nail-text-muted hover:nail-text-main nail-border'
                      }`}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 fill-current" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Example sentences */}
                  <div className="p-2.5 rounded-xl nail-bg-subtle border nail-border-subtle space-y-1 text-xs">
                    <p className="nail-text-main font-medium italic">
                      "{item.exampleEn}"
                    </p>
                    <p className="nail-text-muted">
                      👉 {item.exampleVi}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
