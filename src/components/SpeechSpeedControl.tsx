import React, { useState, useEffect, useRef } from 'react';
import { Gauge, ChevronDown, Check } from 'lucide-react';
import { SpeechSpeed } from '../types';
import { SpeechService, SPEECH_SPEED_OPTIONS } from '../services/speechService';

export function useSpeechSpeed() {
  const [speed, setSpeedState] = useState<SpeechSpeed>(SpeechService.getGlobalSpeed());

  useEffect(() => {
    // Sync initial speed
    setSpeedState(SpeechService.getGlobalSpeed());

    // Subscribe to changes from anywhere in the app
    const unsubscribe = SpeechService.subscribeSpeed((newSpeed) => {
      setSpeedState(newSpeed);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const changeSpeed = (newSpeed: SpeechSpeed) => {
    SpeechService.setGlobalSpeed(newSpeed);
  };

  return { speed, changeSpeed };
}

interface SpeechSpeedControlProps {
  variant?: 'compact' | 'full' | 'inline-buttons';
  className?: string;
  onSpeedChanged?: (newSpeed: SpeechSpeed) => void;
}

export const SpeechSpeedControl: React.FC<SpeechSpeedControlProps> = ({
  variant = 'compact',
  className = '',
  onSpeedChanged,
}) => {
  const { speed, changeSpeed } = useSpeechSpeed();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const currentOption =
    SPEECH_SPEED_OPTIONS.find((opt) => opt.value === speed) || SPEECH_SPEED_OPTIONS[1];

  const handleSelect = (val: SpeechSpeed) => {
    changeSpeed(val);
    setIsOpen(false);
    if (onSpeedChanged) {
      onSpeedChanged(val);
    }
  };

  if (variant === 'inline-buttons') {
    return (
      <div className={`flex items-center space-x-1 p-1 nail-bg-subtle rounded-xl border nail-border ${className}`}>
        {SPEECH_SPEED_OPTIONS.map((opt) => {
          const isSelected = opt.value === speed;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              title={opt.label}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'nail-gradient-accent text-white shadow-xs'
                  : 'nail-text-muted hover:nail-text-main hover:nail-bg-card'
              }`}
            >
              {opt.shortLabel}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Điều chỉnh tốc độ đọc tiếng Anh"
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl nail-bg-subtle hover:nail-bg-card-hover nail-text-main border nail-border text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Gauge className="w-3.5 h-3.5 nail-text-primary" />
        <span className="nail-text-secondary">{variant === 'full' ? currentOption.label : currentOption.shortLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 nail-text-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-2xl nail-card border nail-border shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b nail-border flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider nail-text-subtle">
              Tốc độ đọc tiếng Anh
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded nail-badge-primary font-bold">
              Speech Rate
            </span>
          </div>

          <div className="p-1 space-y-0.5">
            {SPEECH_SPEED_OPTIONS.map((opt) => {
              const isSelected = opt.value === speed;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'nail-badge-primary font-bold shadow-xs'
                      : 'nail-text-main hover:nail-bg-subtle'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className={isSelected ? 'nail-text-secondary font-black' : 'nail-text-main'}>{opt.label}</span>
                    </div>
                    <p className="text-[10px] nail-text-muted mt-0.5 font-normal leading-tight">
                      {opt.description}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 nail-text-primary shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
