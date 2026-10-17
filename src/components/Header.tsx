import React, { useState } from 'react';
import { Sparkles, Flame, Wifi, Smartphone, Monitor, Palette, Sun, Moon, Shield } from 'lucide-react';
import { UserStats } from '../types';
import { SpeechSpeedControl } from './SpeechSpeedControl';
import { ThemeSelectorModal } from './ThemeSelectorModal';
import { GoogleAuthModal } from './GoogleAuthModal';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  stats: UserStats;
  isPhoneFrame: boolean;
  onToggleFrame: () => void;
  onOpenReminders: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  isPhoneFrame,
  onToggleFrame,
  onOpenReminders,
  onOpenAdmin,
}) => {
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { mode, toggleMode, theme } = useTheme();
  const { roleDefinition, isAdmin, currentUser } = useAuth();

  return (
    <>
      <header className="nail-bg-card nail-text-main px-3.5 sm:px-4 py-2.5 border-b nail-border shadow-xs sticky top-0 z-30 transition-colors duration-200">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl nail-gradient-accent flex items-center justify-center shadow-md nail-shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-sm sm:text-base tracking-tight nail-text-main">
                  NailSpeak Pro
                </span>
                <span className="text-[10px] nail-gradient-accent text-white px-2 py-0.5 rounded-full font-bold shadow-xs flex items-center gap-0.5">
                  <span>English for Nail Techs</span> 💅
                </span>
              </div>
              <p className="text-[11px] nail-text-secondary font-semibold tracking-wide">
                Tiếng Anh Bản Địa cho thợ Nail
              </p>
            </div>
          </div>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Google Account Login / Profile Indicator */}
            {currentUser ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                title={`Tài khoản: ${currentUser.name} (${currentUser.email})`}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl nail-bg-subtle hover:bg-white/10 border nail-border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-5 h-5 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full nail-gradient-accent flex items-center justify-center text-[10px] text-white font-extrabold">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <span className="text-[11px] truncate max-w-[90px]">
                  {currentUser.name.split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                title="Đăng nhập tài khoản"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs transition-all active:scale-95 shadow-md border border-amber-400/30 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#FFFFFF"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                  />
                </svg>
                <span className="text-xs font-black tracking-wide">Đăng nhập</span>
              </button>
            )}

            {/* Global Speech Speed Control */}
            <SpeechSpeedControl variant="compact" />

            {/* Salon Theme Selector Button */}
            <button
              onClick={() => setIsThemeModalOpen(true)}
              title={`Đổi bảng màu tiệm nail (Hiện tại: ${theme.nameVi})`}
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-xl nail-bg-subtle hover:nail-bg-card-hover border nail-border text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <Palette className="w-3.5 h-3.5 nail-text-primary" />
              <div
                className="w-2.5 h-2.5 rounded-full border border-white/50 hidden sm:block"
                style={{ backgroundColor: theme.swatchPrimary }}
              />
              <span className="text-[11px] nail-text-main hidden sm:inline">Màu sắc</span>
            </button>

            {/* Quick Light / Dark Mode Toggle */}
            <button
              onClick={toggleMode}
              title={mode === 'dark' ? 'Chuyển sang chế độ Sáng (Salon ban ngày)' : 'Chuyển sang chế độ Tối (Dịu mắt ban đêm)'}
              className="p-1.5 sm:p-2 rounded-xl nail-bg-subtle hover:nail-bg-card-hover nail-text-muted hover:nail-text-main border nail-border transition-colors cursor-pointer"
            >
              {mode === 'dark' ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
              )}
            </button>

            {/* Daily Streak Counter */}
            <button
              onClick={onOpenReminders}
              title="Chuỗi ngày học liên tục & Nhắc nhở"
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-xl nail-badge-gold text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span className="text-[11px] sm:text-xs">{stats.streakDays} ngày</span>
            </button>

            {/* Mobile Frame / Desktop View Toggle */}
            <button
              onClick={onToggleFrame}
              title={isPhoneFrame ? "Chuyển sang chế độ toàn màn hình" : "Chuyển sang chế độ mô phỏng điện thoại"}
              className="p-1.5 sm:p-2 rounded-xl nail-bg-subtle hover:nail-bg-card-hover nail-text-muted hover:nail-text-main border nail-border transition-colors cursor-pointer"
            >
              {isPhoneFrame ? (
                <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 nail-text-primary" />
              ) : (
                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 nail-text-secondary" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Google Sign In Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};
