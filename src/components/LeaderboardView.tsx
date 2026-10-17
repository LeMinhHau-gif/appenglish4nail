import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Bell,
  Clock,
  Sparkles,
  Award,
  Check,
  CheckCircle2,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { INITIAL_LEADERBOARD } from '../data/nailCurriculum';
import { UserStats } from '../types';

interface LeaderboardViewProps {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ stats, onUpdateStats }) => {
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(stats.remindersEnabled);
  const [selectedTime, setSelectedTime] = useState<string>(stats.reminderTime || '08:30');
  const [showNotificationToast, setShowNotificationToast] = useState<boolean>(false);

  // Sync leaderboard with current user's live stats
  const leaderboard = React.useMemo(() => {
    return INITIAL_LEADERBOARD.map((item) => {
      if (item.isCurrentUser) {
        return {
          ...item,
          xp: stats.totalXp,
          streak: stats.streakDays,
        };
      }
      return item;
    }).sort((a, b) => b.xp - a.xp);
  }, [stats.totalXp, stats.streakDays]);

  const handleToggleReminders = () => {
    const nextState = !remindersEnabled;
    setRemindersEnabled(nextState);
    const updated = { ...stats, remindersEnabled: nextState, reminderTime: selectedTime };
    onUpdateStats(updated);

    if (nextState) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      setShowNotificationToast(true);
      setTimeout(() => setShowNotificationToast(false), 3500);
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    const updated = { ...stats, reminderTime: time };
    onUpdateStats(updated);
  };

  const handleTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('NailSpeak Pro 💅', {
        body: 'Đến giờ học 5 phút tiếng Anh giao tiếp rồi anh/chị ơi! Hôm nay luyện bài Upsell nhé!',
        icon: '/favicon.ico',
      });
    }
    setShowNotificationToast(true);
    setTimeout(() => setShowNotificationToast(false), 3000);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
      {/* Daily Study Reminder Card */}
      <div className="p-4 rounded-3xl nail-card border nail-border shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl nail-badge-gold flex items-center justify-center">
              <Bell className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold nail-text-main">
                Nhắc Nhở Học Tập Hàng Ngày
              </h3>
              <p className="text-[11px] nail-text-muted">Duy trì streak 5 phút mỗi ngày trước/sau giờ làm tiệm</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggleReminders}
            className={`w-12 h-6.5 rounded-full transition-colors cursor-pointer relative p-0.5 ${
              remindersEnabled ? 'nail-btn-primary' : 'nail-bg-subtle border nail-border'
            }`}
          >
            <div
              className={`w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform ${
                remindersEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>

        {/* Time Selector Pills */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { time: '08:30', label: '8:30 AM (Trước giờ mở cửa)' },
            { time: '13:00', label: '1:00 PM (Nghỉ trưa tại tiệm)' },
            { time: '20:00', label: '8:00 PM (Sau khi tan ca)' },
          ].map((item) => (
            <button
              key={item.time}
              onClick={() => handleTimeChange(item.time)}
              className={`py-2 px-2 rounded-xl text-center border text-[11px] transition-all cursor-pointer ${
                selectedTime === item.time
                  ? 'nail-badge-primary font-bold shadow-xs'
                  : 'nail-bg-subtle nail-text-muted border nail-border hover:nail-text-main'
              }`}
            >
              <div className="font-bold">{item.time}</div>
              <div className="text-[9px] opacity-80 mt-0.5 truncate">{item.label}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="nail-text-muted text-[11px] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Thông báo bật lúc {selectedTime} mỗi ngày
          </span>
          <button
            onClick={handleTestNotification}
            className="text-[11px] nail-text-primary hover:underline font-semibold cursor-pointer"
          >
            Thử thông báo ngay
          </button>
        </div>

        {/* Toast simulated */}
        {showNotificationToast && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 flex items-center space-x-2 animate-in fade-in">
            <Bell className="w-4 h-4 animate-bounce" />
            <span>Đã cài đặt chuông nhắc nhở học tiếng Anh tiệm nail lúc {selectedTime}!</span>
          </div>
        )}
      </div>

      {/* Leaderboard Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold nail-text-main flex items-center gap-1.5">
            <Trophy className="w-4 h-4 nail-text-secondary" /> Bảng Xếp Hạng Thợ Nail Tại Mỹ
          </h3>
          <span className="text-xs nail-text-muted">Xếp theo điểm kinh nghiệm (XP)</span>
        </div>

        <div className="space-y-2">
          {leaderboard.map((user, index) => {
            const rank = index + 1;
            const isSelf = user.isCurrentUser;

            return (
              <div
                key={user.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isSelf
                    ? 'nail-card border-2 border-theme-primary nail-shadow-glow'
                    : 'nail-card border nail-border'
                }`}
              >
                {/* Left rank & user info */}
                <div className="flex items-center space-x-3">
                  {/* Rank number badge */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                      rank === 1
                        ? 'nail-gradient-gold text-slate-900 shadow-xs'
                        : rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'nail-bg-subtle nail-text-subtle'
                    }`}
                  >
                    {rank}
                  </div>

                  {/* Avatar */}
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-10 h-10 rounded-xl object-cover border nail-border"
                  />

                  {/* Name and State location */}
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="text-xs sm:text-sm font-extrabold nail-text-main">
                        {user.name}
                      </h4>
                      {isSelf && (
                        <span className="text-[10px] nail-gradient-accent text-white font-black px-1.5 py-0.2 rounded-full">
                          Bạn
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] nail-text-muted">
                      <span>📍 {user.salonLocation}</span>
                      <span>•</span>
                      <span className="nail-text-primary font-medium">{user.badge}</span>
                    </div>
                  </div>
                </div>

                {/* Right XP and streak */}
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-black nail-text-main">
                    {user.xp} <span className="text-[10px] nail-text-muted font-semibold">XP</span>
                  </div>
                  <div className="text-[11px] nail-text-secondary font-bold flex items-center justify-end gap-0.5">
                    <Flame className="w-3 h-3 fill-current" />
                    <span>{user.streak}d</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
