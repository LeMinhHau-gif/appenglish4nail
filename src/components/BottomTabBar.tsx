import React from 'react';
import { BookOpen, Mic, BookmarkCheck, BarChart3, Trophy } from 'lucide-react';

export type TabType = 'lessons' | 'voice' | 'vocab' | 'progress' | 'leaderboard';

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  savedVocabCount: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  savedVocabCount,
}) => {
  const tabs = [
    {
      id: 'lessons' as TabType,
      label: 'Bài Học',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'voice' as TabType,
      label: 'Luyện Nói AI',
      icon: Mic,
      badge: 'AI',
    },
    {
      id: 'vocab' as TabType,
      label: 'Từ Vựng',
      icon: BookmarkCheck,
      badge: savedVocabCount > 0 ? savedVocabCount : null,
    },
    {
      id: 'progress' as TabType,
      label: 'Tiến Độ',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'leaderboard' as TabType,
      label: 'Xếp Hạng',
      icon: Trophy,
      badge: null,
    },
  ];

  return (
    <nav className="nail-bg-card backdrop-blur-md border-t nail-border sticky bottom-0 z-30 pb-safe transition-colors duration-200">
      <div className="flex items-center justify-around max-w-md mx-auto px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all cursor-pointer relative ${
                isActive
                  ? 'nail-text-primary font-black'
                  : 'nail-text-muted hover:nail-text-main font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 nail-text-primary stroke-[2.5]' : 'stroke-2'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 nail-gradient-accent text-white text-[9px] font-extrabold px-1 rounded-full border border-white/20 min-w-3.5 text-center leading-3 shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight ${
                  isActive ? 'nail-text-primary font-bold' : 'nail-text-muted'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <div className="w-2 h-1 nail-gradient-accent rounded-full mt-0.5 shadow-xs"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
