/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomTabBar, TabType } from './components/BottomTabBar';
import { LessonCard } from './components/LessonCard';
import { LessonDetailModal } from './components/LessonDetailModal';
import { VoicePracticeView } from './components/VoicePracticeView';
import { VocabularyView } from './components/VocabularyView';
import { ProgressView } from './components/ProgressView';
import { LeaderboardView } from './components/LeaderboardView';
import { NAIL_LESSONS, SALON_CATEGORIES } from './data/nailCurriculum';
import { StorageService } from './services/storageService';
import { Lesson, UserStats, RecordingHistoryItem } from './types';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { AdminPortalModal } from './components/admin/AdminPortalModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { SUBSCRIPTION_PLANS } from './types/rbac';
import {
  Sparkles,
  Flame,
  Search,
  BookOpen,
  Mic,
  Award,
  Layers,
  CheckCircle2,
  Bell,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Crown,
  Lock,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('lessons');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // User Stats & Recording History state
  const [userStats, setUserStats] = useState<UserStats>(StorageService.getUserStats());
  const [recordingHistory, setRecordingHistory] = useState<RecordingHistoryItem[]>(
    StorageService.getRecordingHistory()
  );

  // Phone Simulator Frame toggle
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(false);

  // XP notification popup
  const [xpPopup, setXpPopup] = useState<{ show: boolean; text: string }>({ show: false, text: '' });

  // Admin Portal RBAC Modal state
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(false);

  // Modals for Auth and Subscription
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);

  const { theme, mode } = useTheme();
  const { roleDefinition, currentUser, isAdmin } = useAuth();

  // Listen to #admin hash in URL for administrative entry
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        setIsAdminPortalOpen(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Handle Mark Lesson Complete
  const handleCompleteLesson = (lessonId: string) => {
    const lesson = NAIL_LESSONS.find((l) => l.id === lessonId);
    const updated = StorageService.markLessonComplete(lessonId, lesson?.title);
    setUserStats(updated);
    triggerXpPopup('+150 XP • Hoàn thành bài học xuất sắc!');
  };

  // Handle Bookmark Vocab
  const handleToggleSaveVocab = (vocabId: string) => {
    const updatedVocabIds = StorageService.toggleSavedVocab(vocabId);
    setUserStats((prev) => ({ ...prev, savedVocabIds: updatedVocabIds }));
  };

  // Handle Save Recording
  const handleSaveRecording = (data: {
    lessonId: string;
    targetSentence: string;
    spokenSentence: string;
    score: number;
    rating: string;
    audioBlobUrl?: string;
  }) => {
    const newRec = StorageService.addRecordingHistory(data);
    setRecordingHistory((prev) => [newRec, ...prev]);
    setUserStats(StorageService.getUserStats());
    triggerXpPopup(`+${Math.round(data.score * 0.5)} XP • Thu âm phát âm (${data.score}đ)`);
  };

  const triggerXpPopup = (text: string) => {
    setXpPopup({ show: true, text });
    setTimeout(() => {
      setXpPopup({ show: false, text: '' });
    }, 3200);
  };

  // Filter lessons
  const filteredLessons = NAIL_LESSONS.filter((lesson) => {
    const matchesCategory = selectedCategory === 'all' || lesson.category === selectedCategory;
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Access Permission Verification logic
  // 1. Guest: Only first 3 lessons
  // 2. Learner: Free up to 5 lessons; Full access requires active subscription ($14/$25/$40/$99)
  // 3. Admin / Staff: Unlimited access
  const checkLessonAccess = (lesson: Lesson): {
    allowed: boolean;
    reason?: 'guest_limit' | 'learner_limit' | 'pending';
    badge?: string;
  } => {
    // Determine overall index in master curriculum
    const index = NAIL_LESSONS.findIndex((l) => l.id === lesson.id);

    // If Admin / Content Manager / Staff
    if (currentUser && currentUser.role !== 'learner') {
      return { allowed: true };
    }

    // If Learner with approved subscription
    if (
      currentUser &&
      (currentUser.subscriptionStatus === 'active' ||
        (currentUser.subscriptionPlan && currentUser.subscriptionPlan !== 'free'))
    ) {
      return { allowed: true };
    }

    // If Learner with pending subscription
    if (currentUser && currentUser.subscriptionStatus === 'pending') {
      if (index < 5) return { allowed: true };
      return { allowed: false, reason: 'pending', badge: '⏳ Chờ duyệt gói' };
    }

    // If Learner without subscription
    if (currentUser && currentUser.role === 'learner') {
      if (index < 5) return { allowed: true };
      return { allowed: false, reason: 'learner_limit', badge: '👑 Gói VIP ($14-$99)' };
    }

    // If Guest (not logged in)
    if (!currentUser) {
      if (index < 3) return { allowed: true };
      return { allowed: false, reason: 'guest_limit', badge: '🔒 Khách: 3 bài' };
    }

    return { allowed: true };
  };

  const handleLessonClick = (lesson: Lesson) => {
    const access = checkLessonAccess(lesson);
    if (!access.allowed) {
      if (access.reason === 'guest_limit') {
        setAuthModalMode('signin');
        setIsAuthModalOpen(true);
        triggerXpPopup('Khách chỉ được học 3 bài đầu. Đăng nhập để học tiếp!');
      } else if (access.reason === 'pending') {
        setIsSubscriptionModalOpen(true);
        triggerXpPopup('Yêu cầu đăng ký gói của bạn đang được Admin duyệt!');
      } else {
        setIsSubscriptionModalOpen(true);
      }
      return;
    }
    setSelectedLesson(lesson);
  };

  const activePlanInfo = currentUser?.subscriptionPlan
    ? SUBSCRIPTION_PLANS[currentUser.subscriptionPlan]
    : null;

  return (
    <div className="min-h-screen nail-bg-app flex flex-col items-center justify-start antialiased nail-text-main transition-colors duration-200">
      {/* XP Toast Notification */}
      {xpPopup.show && (
        <div className="fixed top-4 z-50 animate-in slide-in-from-top duration-300 pointer-events-none">
          <div className="nail-btn-primary font-black px-4 py-2 rounded-2xl shadow-xl flex items-center space-x-2 text-xs sm:text-sm border border-white/30">
            <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
            <span>{xpPopup.text}</span>
          </div>
        </div>
      )}

      {/* Main Container: Either Mobile Phone Frame OR Full Responsive */}
      <div
        className={`w-full transition-all duration-300 flex flex-col ${
          isPhoneFrame
            ? 'max-w-[430px] my-4 rounded-[40px] border-[10px] nail-border shadow-2xl overflow-hidden nail-bg-phone min-h-[850px] relative'
            : 'max-w-4xl min-h-screen nail-bg-app'
        }`}
      >
        {/* Native Mobile Status Bar (Visible in phone frame) */}
        {isPhoneFrame && (
          <div className="nail-bg-subtle px-6 pt-2 pb-1 text-[11px] font-bold flex items-center justify-between border-b nail-border select-none nail-text-main">
            <span>9:41</span>
            <div className="w-20 h-4 nail-bg-card rounded-full mx-auto border nail-border"></div>
            <div className="flex items-center space-x-1 text-[10px]">
              <span>5G</span>
              <div className="w-5 h-2.5 border border-current rounded-xs p-0.5 flex items-center">
                <div className="h-full w-full nail-gradient-accent rounded-2xs"></div>
              </div>
            </div>
          </div>
        )}

        {/* Top Header */}
        <Header
          stats={userStats}
          isPhoneFrame={isPhoneFrame}
          onToggleFrame={() => setIsPhoneFrame(!isPhoneFrame)}
          onOpenReminders={() => setActiveTab('leaderboard')}
          onOpenAdmin={() => setIsAdminPortalOpen(true)}
        />

        {/* Main Body Content based on Active Tab */}
        <main className="flex-1 p-3.5 sm:p-5 overflow-y-auto">
          {/* TAB 1: CURRICULUM LESSONS */}
          {activeTab === 'lessons' && (
            <div className="space-y-4">
              {/* Daily Goal / Quick Banner */}
              <div className="p-4 sm:p-5 rounded-3xl nail-card border nail-border shadow-xl relative overflow-hidden">
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full nail-gradient-accent text-white shadow-xs flex items-center gap-1">
                      <span>Tiếng Anh Bản Địa cho thợ Nail</span> 💅
                    </span>
                    <span className="text-xs font-bold flex items-center gap-1 nail-badge-gold px-2.5 py-0.5 rounded-full">
                      <Flame className="w-3.5 h-3.5 fill-current" /> {userStats.streakDays} ngày liên tục
                    </span>
                    {currentUser && currentUser.subscriptionStatus === 'active' && (
                      <span className="text-xs font-extrabold flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>{activePlanInfo?.nameVi || 'VIP Trọn Gói'}</span>
                      </span>
                    )}
                  </div>

                  <h1 className="text-lg sm:text-xl font-black nail-text-main leading-tight uppercase tracking-tight">
                    Tự Tin Giao Tiếp Với Khách Mỹ
                  </h1>
                  <p className="text-xs nail-text-secondary font-semibold max-w-md leading-relaxed">
                    Giải thích quy định an toàn, xin lỗi khi khách chê, từ chối dao cạo gót & làm mịn cách khác
                  </p>
                  <p className="text-[11px] nail-text-muted max-w-md leading-relaxed">
                    Giáo trình trực chiến dành riêng cho thợ nail người Việt tại Hoa Kỳ • Tiếng Anh Bản Địa cho thợ Nail
                  </p>

                  <div className="pt-1.5 flex items-center space-x-2 flex-wrap gap-y-2">
                    <button
                      onClick={() => handleLessonClick(NAIL_LESSONS[0])}
                      className="py-2.5 px-4 rounded-xl nail-btn-primary font-black text-xs flex items-center space-x-1.5 cursor-pointer shadow-md"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Học Bài 1 Ngay</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('voice')}
                      className="py-2.5 px-4 rounded-xl nail-bg-subtle hover:nail-bg-card-hover nail-text-main border nail-border font-bold text-xs flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                    >
                      <Mic className="w-3.5 h-3.5 nail-text-secondary" />
                      <span>Luyện Nói AI</span>
                    </button>
                    {(!currentUser || currentUser.subscriptionStatus !== 'active') && (
                      <button
                        onClick={() => setIsSubscriptionModalOpen(true)}
                        className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-300 border border-amber-500/40 font-extrabold text-xs flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>Xem Gói VIP ($14 - $99)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Subtle Luxury Gradient Ambient Background */}
                <div
                  className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-25"
                  style={{ backgroundColor: theme.swatchPrimary }}
                />
              </div>

              {/* Status Notice Banners for Guest or Pending Learners */}
              {!currentUser && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-purple-950/40 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                      <Sparkles className="w-4 h-4" />
                      <span>Chế độ Khách (Xem thử 3 bài học)</span>
                    </div>
                    <p className="text-[11px] text-white/80">
                      Đăng nhập hoặc đăng ký tài khoản để học thêm bài học và lưu điểm phát âm AI vào đám mây.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setAuthModalMode('signin');
                        setIsAuthModalOpen(true);
                      }}
                      className="py-1.5 px-3.5 rounded-xl nail-btn-primary font-black text-xs cursor-pointer shadow-sm"
                    >
                      Đăng nhập
                    </button>
                    <button
                      onClick={() => {
                        setAuthModalMode('signup');
                        setIsAuthModalOpen(true);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 cursor-pointer"
                    >
                      Đăng ký mới
                    </button>
                  </div>
                </div>
              )}

              {currentUser && currentUser.subscriptionStatus === 'pending' && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                      <Crown className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                        <span>Đã Gửi Yêu Cầu Đăng Ký Gói Học</span>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      </div>
                      <p className="text-[11px] text-white/80 mt-0.5">
                        Hệ thống quản trị đã nhận được thông báo để Admin vào duyệt và mở full bài học cho bạn.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    className="py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold shrink-0 cursor-pointer"
                  >
                    Xem chi tiết
                  </button>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 nail-text-subtle absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Tìm tình huống: cạo gót dao, chê làm ẩu, đau sưng, upsell, tiền tip..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full nail-bg-input border nail-border rounded-2xl pl-10 pr-4 py-2.5 text-xs nail-text-main placeholder:nail-text-subtle focus:outline-none focus:border-theme-primary transition-colors shadow-inner"
                />
              </div>

              {/* Category Filter Pills (Horizontal Scroll) */}
              <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1 text-xs">
                {SALON_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`py-1.5 px-3 rounded-xl whitespace-nowrap font-bold transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'nail-gradient-accent text-white shadow-xs'
                        : 'nail-bg-card nail-text-muted hover:nail-text-main border nail-border'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Lessons Grid List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs nail-text-muted px-1 font-semibold">
                  <span>Danh sách bài học thực chiến:</span>
                  <span>{filteredLessons.length} bài</span>
                </div>

                {filteredLessons.length === 0 ? (
                  <div className="p-8 text-center nail-text-muted text-xs nail-card rounded-3xl">
                    Không tìm thấy bài học nào với từ khóa này.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredLessons.map((lesson) => {
                      const access = checkLessonAccess(lesson);
                      return (
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          isCompleted={userStats.completedLessonIds.includes(lesson.id)}
                          onSelect={() => handleLessonClick(lesson)}
                          isLocked={!access.allowed}
                          lockBadge={access.badge}
                          isVipRequired={access.reason === 'learner_limit' || access.reason === 'pending'}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Call to Action Pricing Card at the Bottom of Lessons */}
              {(!currentUser || currentUser.subscriptionStatus !== 'active') && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/40 via-rose-950/40 to-slate-900 border border-amber-500/30 shadow-xl space-y-3.5 mt-6">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm sm:text-base text-amber-200">
                          Đăng Ký Gói Học Tiếng Anh Bản Địa Cho Thợ Nail
                        </h4>
                        <p className="text-[11px] text-white/70">
                          {currentUser
                            ? 'Người học được học thử miễn phí tối đa 5 bài học'
                            : 'Khách được học thử 3 bài học đầu tiên'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4 Pricing Package Highlights */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div
                      onClick={() => setIsSubscriptionModalOpen(true)}
                      className="p-3 rounded-2xl bg-black/40 border border-white/10 text-center hover:border-amber-400/50 cursor-pointer transition-all"
                    >
                      <div className="text-[11px] font-bold text-slate-300">Gói 3 Tháng</div>
                      <div className="text-xl font-black text-amber-300 my-0.5">$14</div>
                      <div className="text-[10px] text-white/60">Khởi động</div>
                    </div>
                    <div
                      onClick={() => setIsSubscriptionModalOpen(true)}
                      className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-center ring-1 ring-amber-400/30 hover:border-amber-400 cursor-pointer transition-all"
                    >
                      <div className="text-[11px] font-bold text-amber-200">Gói 6 Tháng 🔥</div>
                      <div className="text-xl font-black text-amber-300 my-0.5">$25</div>
                      <div className="text-[10px] text-amber-300/80 font-bold">Phổ biến nhất</div>
                    </div>
                    <div
                      onClick={() => setIsSubscriptionModalOpen(true)}
                      className="p-3 rounded-2xl bg-black/40 border border-white/10 text-center hover:border-amber-400/50 cursor-pointer transition-all"
                    >
                      <div className="text-[11px] font-bold text-slate-300">Gói 1 Năm 💎</div>
                      <div className="text-xl font-black text-amber-300 my-0.5">$40</div>
                      <div className="text-[10px] text-white/60">Tiết kiệm nhất</div>
                    </div>
                    <div
                      onClick={() => setIsSubscriptionModalOpen(true)}
                      className="p-3 rounded-2xl bg-black/40 border border-white/10 text-center hover:border-amber-400/50 cursor-pointer transition-all"
                    >
                      <div className="text-[11px] font-bold text-slate-300">Gói Vĩnh Viễn 👑</div>
                      <div className="text-xl font-black text-amber-300 my-0.5">$99</div>
                      <div className="text-[10px] text-white/60">Trọn đời</div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] text-white/70 italic">
                      * Sau khi đăng ký, hệ thống quản trị sẽ nhận thông báo để Admin vào duyệt ngay.
                    </span>
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          setAuthModalMode('signin');
                          setIsAuthModalOpen(true);
                        } else {
                          setIsSubscriptionModalOpen(true);
                        }
                      }}
                      className="py-2.5 px-5 rounded-xl nail-btn-primary font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
                    >
                      <Crown className="w-4 h-4" />
                      <span>{currentUser ? 'Đăng Ký Mở Khóa Full Gói' : 'Đăng Nhập / Đăng Ký Gói'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI VOICE PRACTICE & ROLEPLAY */}
          {activeTab === 'voice' && (
            <VoicePracticeView onSaveRecording={handleSaveRecording} />
          )}

          {/* TAB 3: VOCABULARY & FLASHCARDS */}
          {activeTab === 'vocab' && (
            <VocabularyView
              savedVocabIds={userStats.savedVocabIds}
              onToggleSaveVocab={handleToggleSaveVocab}
            />
          )}

          {/* TAB 4: PROGRESS & LEARNING HISTORY */}
          {activeTab === 'progress' && (
            <ProgressView stats={userStats} recordingHistory={recordingHistory} />
          )}

          {/* TAB 5: LEADERBOARD & REMINDERS */}
          {activeTab === 'leaderboard' && (
            <LeaderboardView
              stats={userStats}
              onUpdateStats={(newStats) => {
                setUserStats(newStats);
                StorageService.saveUserStats(newStats);
              }}
            />
          )}
        </main>

        {/* Bottom Navigation Bar */}
        <BottomTabBar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          savedVocabCount={userStats.savedVocabIds.length}
        />

        {/* Clean Homepage Footer without clutter */}
        <footer className="py-2.5 px-4 text-center border-t nail-border bg-black/10 text-[11px] nail-text-muted flex items-center justify-between">
          <span>Tiếng Anh Bản Địa cho thợ Nail • NailSpeak Pro</span>
          <span className="text-[10px] text-white/40">v2.5 Full Access</span>
        </footer>
      </div>

      {/* Lesson Detail Interactive Modal */}
      {selectedLesson && (
        <LessonDetailModal
          lesson={selectedLesson}
          isCompleted={userStats.completedLessonIds.includes(selectedLesson.id)}
          savedVocabIds={userStats.savedVocabIds}
          onToggleSaveVocab={handleToggleSaveVocab}
          onCompleteLesson={handleCompleteLesson}
          onSaveRecording={handleSaveRecording}
          onClose={() => setSelectedLesson(null)}
        />
      )}

      {/* RBAC Admin Portal Modal (Accessible via #admin URL or by admin actions) */}
      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => {
          setIsAdminPortalOpen(false);
          if (window.location.hash === '#admin') {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
      />

      {/* Google Auth Modal (Login / Register) */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
        onOpenPricing={() => setIsSubscriptionModalOpen(true)}
      />

      {/* Subscription Pricing & Registration Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onOpenAuth={() => {
          setAuthModalMode('signin');
          setIsAuthModalOpen(true);
        }}
        onSuccess={() => {
          triggerXpPopup('Đã gửi đăng ký gói! Admin sẽ duyệt sớm cho bạn.');
        }}
      />
    </div>
  );
}
