import React from 'react';
import { Clock, CheckCircle2, ChevronRight, Lock, Crown, Sparkles } from 'lucide-react';
import { Lesson } from '../types';

interface LessonCardProps {
  lesson: Lesson;
  isCompleted: boolean;
  onSelect: (lesson: Lesson) => void;
  isLocked?: boolean;
  lockBadge?: string;
  isVipRequired?: boolean;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  isCompleted,
  onSelect,
  isLocked = false,
  lockBadge,
  isVipRequired = false,
}) => {
  return (
    <div
      onClick={() => onSelect(lesson)}
      className={`group relative nail-card rounded-3xl p-4.5 transition-all duration-200 cursor-pointer ${
        isLocked
          ? 'opacity-85 hover:opacity-100 border-amber-500/20 hover:border-amber-500/40'
          : isCompleted
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : 'nail-border-hover'
      }`}
    >
      {/* Top Meta Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg nail-badge-primary">
            {lesson.categoryNameVi}
          </span>
          <span className="text-[11px] font-medium nail-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3 nail-text-secondary" />
            {lesson.estimatedMinutes} phút
          </span>
        </div>

        {isLocked ? (
          <span
            className={`flex items-center space-x-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-xs ${
              isVipRequired
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            }`}
          >
            {isVipRequired ? (
              <Crown className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>{lockBadge || (isVipRequired ? 'Gói VIP' : 'Cần Đăng Nhập')}</span>
          </span>
        ) : isCompleted ? (
          <span className="flex items-center space-x-1 text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã học</span>
          </span>
        ) : (
          <span className="text-[11px] font-semibold nail-text-subtle nail-bg-subtle px-2 py-0.5 rounded-full border nail-border-subtle">
            {lesson.difficulty}
          </span>
        )}
      </div>

      {/* Title & Tagline */}
      <h3 className="font-extrabold nail-text-main text-base group-hover:nail-text-primary transition-colors leading-snug mb-1.5 flex items-center gap-2">
        <span>{lesson.title}</span>
        {isLocked && <Lock className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />}
      </h3>
      <p className="text-xs nail-text-muted line-clamp-2 leading-relaxed mb-3">
        {lesson.tagline}
      </p>

      {/* Mini dialogue preview snippet */}
      <div className="nail-bg-subtle p-3 rounded-2xl border nail-border-subtle mb-3 space-y-1">
        <p className="text-xs font-bold nail-text-main italic line-clamp-1">
          💬 "{lesson.dialogue[1]?.english || lesson.keyPhrases[0]?.english}"
        </p>
        <p className="text-[11px] nail-text-secondary font-semibold line-clamp-1">
          👉 {lesson.dialogue[1]?.vietnamese || lesson.keyPhrases[0]?.vietnamese}
        </p>
      </div>

      {/* Bottom stats and CTA */}
      <div className="flex items-center justify-between pt-2 border-t nail-border-subtle text-xs">
        <div className="flex items-center space-x-3 nail-text-subtle text-[11px]">
          <span>{lesson.dialogue.length} câu thoại</span>
          <span>•</span>
          <span>{lesson.vocabulary.length} từ vựng</span>
        </div>
        <div className="flex items-center space-x-1 font-bold nail-text-primary text-xs group-hover:translate-x-1 transition-all">
          <span>{isLocked ? (isVipRequired ? 'Đăng ký gói mở khóa' : 'Đăng nhập để học') : 'Vào học'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
